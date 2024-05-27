const con = require('../database/db');
const bcrypt = require('bcrypt');

const saltRounds = 10;

con.connect(function (err) {
    const sql = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        type ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        image VARCHAR(255) NOT NULL DEFAULT 'https://res.cloudinary.com/dsv8lpacy/image/upload/v1710962002/library/Kw9sLx3vPq.png',
        description TEXT,
        favorite_book INT,
        UNIQUE (username),
        UNIQUE (email),
        FOREIGN KEY (favorite_book) REFERENCES books(id)
      )`;

    con.query(sql, (err, result) => {
      if (err) {
        console.error('Error creating users table:', err);
        return;
      }
      console.log('Users table created');

      checkAndCreateAdmin().catch((err) => {
        console.error('Error checking or creating admin user:', err);
      });
    });
  }
);

async function checkAndCreateAdmin() {
  const adminUserExists = await userExists('admin', 'admin@mail.com');

  if (!adminUserExists) {
    const hashedPassword = await hashPassword('123');

    const sql = 'INSERT INTO users (username, email, password, type) VALUES (?, ?, ?, ?)';
    con.query(sql, ['admin', 'admin@mail.com', hashedPassword, 'admin'], (err, result) => {
      if (err) {
        console.error('Error creating admin user:', err);
      } else {
        console.log('Admin user created');
      }
    });
  }
}

async function userExists(username, email) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
    con.query(query, [username, email], function (err, rows) {
      if (err) {
        reject(err);
      } else {
        resolve(rows.length > 0);
      }
    });
  });
}

async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  userExists,
  hashPassword,
  comparePassword
};