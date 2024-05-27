const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.SECRET;
const con = require('../database/db');

module.exports = async function (req, res, next) {
    try {
        const { commentId } = req.params;
        const token = req.headers['authorization']?.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;

        const [comments] = await con.promise().query('SELECT * FROM comments WHERE id = ?', [commentId]);
        const comment = comments[0];
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        
        if (comment.user !== req.userId) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        next();
    } catch (error) {
        console.error('Error in isAuthor middleware:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};