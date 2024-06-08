const con = require('../database/db');
const { userExists, hashPassword, comparePassword } = require('../models/User');
const { UserBuilder } = require('../utils/models/User');
const SessionManager = require('../utils/SessionManager');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.SECRET;
const passport = require("passport");
const bcrypt = require("bcrypt");
const { cloudinary } = require('../cloudinary');
require('dotenv').config();

const generateToken = (user) => {
  const payload = { userId: user.id, username: user.username, type: user.type, image: user.image };
  return jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
};

module.exports.register = async (req, res) => {
  try {
      const { username, email, password } = req.body;
      const terminal_ip = req.clientIp;
      if (!username || !email || !password) {
          return res.status(422).json({ message: 'Please make sure all fields are filled in correctly.' });
      }
      if (password.length < 3) {
          return res.status(400).json({ message: 'Password is too short.' });
      }
      if (await userExists(username.trim(), email)) {
          return res.status(400).json({ message: 'User already exists or email is already in use.' });
      }

      const hashedPassword = await hashPassword(password);
      const userBuilder = new UserBuilder()
          .setUsername(username)
          .setEmail(email)
          .setPassword(hashedPassword);

      const user = userBuilder.build();

      const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
      con.query(query, [user.username, user.email, user.password], function (err, result) {
          if (err) {
              return res.status(500).json({ message: 'Internal server error' });
          }
          con.promise().query('SELECT image FROM users WHERE id = ?', [result.insertId])
              .then(([rows]) => {
                  const image = rows[0].image;
                  con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Registered User", ?, ?, ?)', [terminal_ip, result.insertId, username]);
                  const payload = { id: result.insertId, username, type: user.type, image };
                  const token = generateToken(payload);
                  const sessionId = SessionManager.createSession(result.insertId);
                  res.json({ token, sessionId });
              })
              .catch((err) => {
                  console.error('Error retrieving user image:', err);
                  res.status(500).json({ message: 'Internal server error' });
              });
      });
  } catch (err) {
      console.error('Error registering user:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.login = (req, res, next) => {
  const terminal_ip = req.clientIp;
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    con.promise().query('SELECT image FROM users WHERE id = ?', [user.id])
    .then(([rows]) => {
      con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Successful Login", ?, ?, ?)', [terminal_ip, user.id, user.username]);
      const image = rows[0].image;
      const payload = { id: user.id, username: user.username, type: user.type, image };
      const token = generateToken(payload);
      const sessionId = SessionManager.createSession(user.id);
      console.log(sessionId)
      res.json({ token, sessionId });
    })
    .catch(err => {
      console.error('Error fetching user image:', err);
      return res.status(500).json({ message: 'Internal server error' });
    });
  })(req, res, next);
};

module.exports.logout = (req, res) => {
  const { sessionId } = req.body;

  const duration = SessionManager.calculateSessionDuration(sessionId);

  SessionManager.destroySession(sessionId);

  console.log(duration)

  res.json({ message: 'Logged out', sessionDuration: duration });
};

module.exports.updateUser = async (req, res, next) => {
  const id = req.userId;
  const terminal_ip = req.clientIp;
  if (id != req.params.id) return res.status(401).json({ message: "Unauthorized." });
  const { email, password, description } = req.body;
  if (!email || !password) return res.status(422).json({ message: 'Please make sure the necessary fields are filled in correctly.' });
  const [rows] = await con.promise().query("SELECT email, password FROM users WHERE id = ?", [id]);
  if ((email !== rows[0].email) && await userExists(null, email)) return res.status(400).json({ message: "There is already an account using this e-mail address." });
  if (password && password.length < 3) return res.status(400).json({ message: "Password is too short." });
  let hashedPassword = rows[0].password;
  if (password && password !== rows[0].password) {
    const passwordMatch = await new Promise((resolve, reject) => {
      bcrypt.compare(password, rows[0].password, function (err, res) {
        if (err) reject(err);
        resolve(res);
      });
    });
    if (!passwordMatch) {
      hashedPassword = await hashPassword(password);
    }
  }
  await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Updated User", ?, ?, ?)', [terminal_ip, id, email]);
  await con.promise().query("UPDATE users SET email = ?, password = ?, description = ? WHERE id = ?", [email, hashedPassword, description, id]);
  res.json('User updated');
  (req, res, next);
};

module.exports.changeImage = async (req, res, next) => {
  const { id } = req.params;
  const terminal_ip = req.clientIp;
  if (id != req.userId) return res.status(401).json({ message: "Unauthorized." });
  let image = process.env.CLOUDINARY_PROFILE_URL;
  if (req.file) {
    image = req.file.path;
  }
  const [oldRows] = await con.promise().query('SELECT username, image FROM users WHERE id = ?', [id]);
  const oldImageUrl = oldRows[0].image;
  const username = oldRows[0].username;
  const oldPublicId = oldImageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
  await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Updated User Image", ?, ?, ?)', [terminal_ip, id, username]);
  await con.promise().query('UPDATE users SET image = ? WHERE id = ?', [image, id]);
  const [rows] = await con.promise().query('SELECT image FROM users WHERE id = ?', [id]);
  const imageUrl = rows[0].image;
  const publicId = imageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
  if (publicId !== oldPublicId && oldPublicId !== process.env.CLOUDINARY_PROFILE_ID) {
    await cloudinary.uploader.destroy(oldPublicId);
  }
  passport.authenticate("local", (err, user) => {
    if (err) {
      console.error('Error during update:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    con.promise().query('SELECT username, type, image FROM users WHERE id = ?', [id])
        .then(([rows, fields]) => {
          const image = rows[0].image;
          const username = rows[0].username;
          const type = rows[0].type;
          const payload = { id: id, username, type, image };
          const token = generateToken(payload);
          res.json({ token });
        })
  })(req, res, next);
};

module.exports.showUser = async (req, res) => {
  const { id } = req.params;
  con.query('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
      if (!user) return res.status(404).json({ message: 'User not found' });
      con.query('SELECT users.favorite_book, books.title, books.image, books.author, authors.name as authorName FROM users INNER JOIN books ON books.id = users.favorite_book INNER JOIN authors ON books.author = authors.id WHERE users.id = ?;', [id], (err, favorite_book) => {
          const responseData = {
            user: user,
            book: favorite_book
          };
          res.json(responseData);
      });
  });
};

module.exports.favorite = async (req, res, next) => {
  const id = req.userId;
  const bookId = req.params.id;
  const [rows] = await con.promise().query('SELECT favorite_book FROM users WHERE id = ?', [id]);
  const favorite_book = rows[0].favorite_book;
  await con.promise().query(`UPDATE users SET favorite_book = ${favorite_book == bookId ? "NULL" : bookId} WHERE id = ?`, [id]);
  res.json('User updated');
  (req, res, next);
};

module.exports.loginStrategy = async (req, username, password, done) => {
  const terminal_ip = req.clientIp;
  try {
    const [user] = await new Promise((resolve, reject) => {
      con.query('SELECT * FROM users WHERE username=?', [username], function (err, rows) {
        if (err) reject(err);
        resolve(rows);
      });
    });

    if (!user) {
      await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Unsuccessful Login (User does not exist)", ?, ?, ?)', [terminal_ip, null, username]);
      return done(null, false, { message: 'Incorrect username or password.' });
    }

    const logs = await con.promise().query('SELECT COUNT(*) FROM logs WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 10 MINUTE) AND action_type LIKE "Unsuccessful Login%"', [user.id]);
    const count = logs[0][0]['COUNT(*)'];
    if (count > 4) {
      await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Unsuccessful Login (Too Many Attempts)", ?, ?, ?)', [terminal_ip, user.id, username]);
      return done(null, false, { message: 'Too many login attempts! Try again later.' });
    }

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      await con.promise().query('INSERT INTO logs (action_type, terminal_ip, user_id, record) VALUES ("Unsuccessful Login (Wrong password)", ?, ?, ?)', [terminal_ip, user.id, username]);
      return done(null, false, { message: 'Incorrect username or password.' });
    }

    return done(null, { id: user.id, username: user.username, type: user.type });
  } catch (err) {
    return done(err);
  }
};