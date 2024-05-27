const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.SECRET;

module.exports = function (req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
}