const con = require('../database/db')

con.connect(function (err) {
    const sql = `
    CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        body TEXT NOT NULL,
        rating INT NOT NULL,
        book_id INT NOT NULL,
        user INT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE
    )`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Comments table created");
    });
});