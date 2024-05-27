const con = require('../database/db');

module.exports.getAvailableBooks = async (req, res) => {
    con.query('SELECT books.*, authors.name as authorName FROM books INNER JOIN authors ON books.author = authors.id WHERE qty_available > 0', (err, books) => {
      res.send(books)
    });
}

module.exports.createRent = async (req, res) => {
    const bookId = req.params.id;
    const userId = req.userId;
    const [rows] = await con.promise().query('SELECT qty_available FROM books WHERE id = ?', [bookId]);
    const available = rows[0]?.qty_available;
    if (!available || available < 1) {
      return res.status(400).json({ error: 'Book unavailable!' });
    }
    const { daysRented } = req.body;
    if (!daysRented || daysRented < 1) {
      return res.status(422).json({ message: 'Insert a valid number of days.' });
    }
    await con.promise().query('INSERT INTO rents (date_rented, date_for_return, book_id, user) VALUES (CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?, ?)', [daysRented, bookId, userId]);
    await con.promise().query('UPDATE books SET qty_available = qty_available - 1 WHERE id = ?', bookId);
    return res.status(200).json({ message: 'Book rented!' });
}

module.exports.allRents = async (req, res) => {
    con.query("SELECT * FROM rents WHERE status = 'active' AND date_for_return < CURDATE()", (err, activeRents) => {
        activeRents.forEach((activeRent) => {
            con.query("UPDATE rents SET status = 'late' WHERE id = ?", [activeRent.id]);
        });
    })
    con.query('SELECT rents.*, books.title, authors.name as authorName, users.username FROM rents INNER JOIN books ON rents.book_id = books.id INNER JOIN authors ON books.author = authors.id INNER JOIN users ON rents.user = users.id', (err, rents) => {
      res.send(rents);
    });
};

module.exports.myRents = async (req, res) => {
    const userId = req.userId;
    con.query("SELECT * FROM rents WHERE status = 'active' AND date_for_return < CURDATE()", (err, activeRents) => {
        activeRents.forEach(async (activeRent) => {
            con.query("UPDATE rents SET status = 'late' WHERE id = ?", [activeRent.id]);
        });
    })
    con.query('SELECT rents.*, books.title, authors.name as authorName FROM rents INNER JOIN books ON rents.book_id = books.id INNER JOIN authors ON books.author = authors.id WHERE rents.user = ?', [userId], (err, rents) => {
        res.send(rents)
    });
}

module.exports.returnRent = async (req, res) => {
    const rentId = req.params.id;
    const [rows] = await con.promise().query('SELECT book_id, status FROM rents WHERE id = ?', [rentId]);
    const bookId = rows[0].book_id;
    const status = rows[0].status;
    if (status !== "returned") {
        await con.promise().query('UPDATE rents SET date_returned = CURDATE(), status = "returned" WHERE id = ?', [rentId]);
        await con.promise().query('UPDATE books SET qty_available = qty_available + 1 WHERE id = ?', [bookId]);
        res.json("Book returned!")
    } else {
        res.json("Book was already returned.")
    }
}