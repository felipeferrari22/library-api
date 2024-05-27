const con = require('../database/db');

module.exports.createComment = async (req, res) => {
    const userId = req.userId;
    const bookId = req.params.id;
    const { body, rating } = req.body;
    if (!body || !rating) {
        return res.status(422).json({ message: 'Please make sure all fields are filled in correctly.' });
    } 
    if (5 < rating || rating < 1) {
        return res.status(422).json({ message: 'Insert a valid number.' })
    }
    await con.promise().query('INSERT INTO comments (body, rating, book_id, user) VALUES (?, ?, ?, ?)', [body, rating, bookId, userId]);
    res.json('Comment created');
}

module.exports.deleteComment = async (req, res) => {
    const { commentId } = req.params;
    await con.promise().query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json('Comment deleted');
}