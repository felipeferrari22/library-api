const con = require('../database/db');
const { cloudinary } = require('../cloudinary');
require('dotenv').config();
const requestIp = require('request-ip');

module.exports.getBooks = async (req, res) => {
    const { search } = req.query;
    con.query(`SELECT books.*, authors.name as authorName FROM books INNER JOIN authors ON books.author = authors.id WHERE books.title LIKE '${search}%'`, [search], (err, books) => {
      res.send(books)
    });
}

module.exports.createBook = async (req, res) => {
    let image = process.env.CLOUDINARY_BOOK_URL;
    const terminal_ip = req.clientIp;
    const user_id = req.user.userId;
    if (req.file) {
        image = req.file.path;
    }
    const { title, release_date, description, author, qty_available } = req.body;
    if (!(/[a-zA-Z]/.test(title))) {
        return res.status(422).json({ message: 'Insert a valid title.' });
    } 
    if (!(/[a-zA-Z]/.test(author))) {
        return res.status(422).json({ message: 'Insert a valid author name.' });
    }
    if (!qty_available || qty_available < 0) {
        return res.status(422).json({ message: 'Insert a valid quantity of available books.' })
    }
    if (!release_date || release_date == 'Invalid date') {
        return res.status(422).json({ message: 'Insert a valid date.' })
    }
    const [authorRows] = await con.promise().query('SELECT id FROM authors WHERE name = ?', [author]);
    if (authorRows.length === 0) {
        const [insertedAuthor] = await con.promise().query('INSERT INTO authors (name) VALUES (?)', [author]);
        authorId = insertedAuthor.insertId;
    } else {
        authorId = authorRows[0].id;
    }
    await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Created Book", ?, ?, ?)', [terminal_ip, user_id, title]);
    await con.promise().query('INSERT INTO books (title, release_date, qty_available, description, image, author) VALUES (?, ?, ?, ?, ?, ?)', [title, release_date, qty_available, description, image, authorId]);
    res.json('Book created');
}

module.exports.deleteBook = async (req, res) => {
    const { id } = req.params;
    const terminal_ip = req.clientIp;
    const user_id = req.user.userId;
    const [rows] = await con.promise().query('SELECT title, image FROM books WHERE id = ?', [id]);
    const imageUrl = rows[0].image;
    const title = rows[0].title;
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
    if (publicId !== process.env.CLOUDINARY_BOOK_ID) {
        await cloudinary.uploader.destroy(publicId);
    }
    await con.promise().query("UPDATE users SET favorite_book = NULL WHERE favorite_book = ?", [id]);
    await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Deleted Book", ?, ?, ?)', [terminal_ip, user_id, title]);
    await con.promise().query('DELETE FROM books WHERE id = ?', [id]);
    res.json('Book deleted');
}

module.exports.updateBook = async (req, res) => {
    const { title, release_date, description, author, qty_available } = req.body;
    const terminal_ip = req.clientIp;
    const user_id = req.user.userId;
    if (!(/[a-zA-Z]/.test(title))) {
        return res.status(422).json({ message: 'Insert a valid title.' });
    } 
    if (!(/[a-zA-Z]/.test(author))) {
        return res.status(422).json({ message: 'Insert a valid author name.' });
    }
    if (!qty_available || qty_available < 0) {
        return res.status(422).json({ message: 'Insert a valid quantity of available books.' })
    }
    const { id } = req.params;
    const [authorRows] = await con.promise().query('SELECT id FROM authors WHERE name = ?', [author]);
    if (authorRows.length === 0) {
        const [insertedAuthor] = await con.promise().query('INSERT INTO authors (name) VALUES (?)', author);
        authorId = insertedAuthor.insertId;
    } else {
        authorId = authorRows[0].id;
    }
    await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Updated Book", ?, ?, ?)', [terminal_ip, user_id, title]);
    await con.promise().query('UPDATE books SET title = ?, release_date = ?, description = ?, author = ?, qty_available = ? WHERE id = ?', [title, release_date, description, authorId, qty_available, id]);
    res.json('Book updated');
}

module.exports.changeImage = async (req, res) => {
    let image = process.env.CLOUDINARY_BOOK_URL;
    const terminal_ip = req.clientIp;
    const user_id = req.user.userId;
    if (req.file) {
        image = req.file.path;
    }
    const { id } = req.params;
    const [oldRows] = await con.promise().query('SELECT title, image FROM books WHERE id = ?', [id]);
    const title = oldRows[0].title;
    const oldImageUrl = oldRows[0].image;
    const oldPublicId = oldImageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
    await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Updated Book Image", ?, ?, ?)', [terminal_ip, user_id, title]);
    await con.promise().query('UPDATE books SET image = ? WHERE id = ?', [image, id]);
    const [rows] = await con.promise().query('SELECT image FROM books WHERE id = ?', [id]);
    const imageUrl = rows[0].image;
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
    if (publicId !== oldPublicId && oldPublicId !== process.env.CLOUDINARY_BOOK_ID) {
        await cloudinary.uploader.destroy(oldPublicId);
    }
    res.json('Image updated');
};

module.exports.showBook = async (req, res) => {
    const { id } = req.params;
    con.query('SELECT books.*, authors.name as authorName FROM books INNER JOIN authors ON books.author = authors.id WHERE books.id = ?', [id], (err, results) => {
        const book = results[0];
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        con.query('SELECT comments.*, users.username FROM comments INNER JOIN users ON comments.user = users.id WHERE comments.book_id = ?', id, (err, comments) => {
            const responseData = {
                book: book,
                comments: comments
            };
            res.json(responseData);
        });
    })
}