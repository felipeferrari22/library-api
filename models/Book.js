const con = require('../database/db')

con.connect(function (err) {
    const sql = `
    CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        release_date DATE NOT NULL,
        image VARCHAR(255) NOT NULL DEFAULT '${process.env.CLOUDINARY_BOOK_URL}',
        qty_available INT NOT NULL,
        author INT NOT NULL,
        description TEXT,
        FOREIGN KEY (author) REFERENCES authors(id) ON DELETE CASCADE
    )`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Books table created");
    });
});