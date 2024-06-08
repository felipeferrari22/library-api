const con = require('../database/db');

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected to the database!");

    const sql = `
    CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action_type VARCHAR(50) NOT NULL, -- Tipo de ação: alteração, deleção, login_sucesso, login_falha
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        terminal_ip VARCHAR(45) NOT NULL,
        user_id INT,
        record TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`;

    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("Logs table created");
    });
});