const con = require('../database/db')

con.connect(function (err) {
    const sql = `
    CREATE TABLE IF NOT EXISTS rents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date_rented DATE NOT NULL,
        date_for_return DATE NOT NULL,
        date_returned DATE,
        status VARCHAR(255) NOT NULL DEFAULT "active",
        book_id INT NOT NULL,
        user INT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (user) REFERENCES users(id) ON DELETE CASCADE
    )`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Rents table created");
    });
});