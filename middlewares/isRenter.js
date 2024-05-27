const jwt = require('jsonwebtoken');
require('dotenv').config();
const jwtSecret = process.env.SECRET;
const con = require('../database/db');

module.exports = async function (req, res, next) {
    try {
        const rentId = req.params.id;
        const token = req.headers['authorization']?.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;

        const [rents] = await con.promise().query('SELECT * FROM rents WHERE id = ?', [rentId]);
        const rent = rents[0];
        
        if (!rent) {
            return res.status(404).json({ message: 'Rent not found.' });
        }
        
        if (rent.user !== req.userId) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        next();
    } catch (error) {
        console.error('Error in isRenter middleware:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};