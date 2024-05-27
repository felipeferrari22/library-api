const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.SECRET;

module.exports = function (req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  }
};