const con = require('../database/db');
const { cloudinary } = require('../cloudinary');
require('dotenv').config();

module.exports.getAuthors = async (req, res) => {
    const { search } = req.query;
    con.query(`SELECT * FROM authors WHERE name LIKE '${search}%'`, [search], (err, authors) => {
      res.send(authors)
    });
}

module.exports.showAuthor = async (req, res) => {
  const { id } = req.params;
  con.query('SELECT * FROM authors WHERE authors.id = ?', [id], (err, author) => {
      if (!author) {
          return res.status(404).json({ message: 'Author not found' });
      }
      con.query('SELECT id, title, image FROM books WHERE author = ?', [id], (err, books) => {
          const responseData = {
              author: author,
              books: books
          };
          res.json(responseData);
      });
  });
};

module.exports.createAuthor = async (req, res) => {
    let image = process.env.CLOUDINARY_PROFILE_URL;
    if (req.file) {
        image = req.file.path;
    }
    const { name, description } = req.body;
    if (!(/[a-zA-Z]/.test(name))) {
        return res.status(422).json({ message: 'Insert a valid name.' });
    }
    await con.promise().query('INSERT INTO authors (name, image, description) VALUES (?, ?, ?)', [name, image, description]);
    res.json('Author created');
}

module.exports.deleteAuthor = async (req, res) => {
    const { id } = req.params;
    const [books] = await con.promise().query('SELECT id FROM books WHERE author = ?', [id]);
    if (books && books.length > 0) {
        const bookIds = books.map((book) => book.id);
        await con.promise().query("UPDATE users SET favorite_book = NULL WHERE favorite_book IN (?)", [bookIds]);
        const filenames = await con.promise().query('SELECT image FROM books WHERE id IN (?)', [bookIds]);
        for (let i = 0; i < filenames[0].length; i++) {
            const filename = filenames[0][i].image;
            const publicId = filename.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
            if (publicId !== process.env.CLOUDINARY_BOOK_ID) {
                await cloudinary.uploader.destroy(publicId);
            }
        }
    }
    const [authorRows] = await con.promise().query('SELECT image FROM authors WHERE id = ?', [id]);
    const authorImageUrl = authorRows[0].image;
    const authorPublicId = authorImageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
    if (authorPublicId !== process.env.CLOUDINARY_PROFILE_ID) {
        await cloudinary.uploader.destroy(authorPublicId);
    }
    await con.promise().query('DELETE FROM authors WHERE id = ?', [id]);
    res.json('Author deleted');
};

module.exports.updateAuthor = async (req, res) => {
    const { name, description } = req.body;
    const { id } = req.params;
    if (!(/[a-zA-Z]/.test(name))) {
        return res.status(422).json({ message: 'Insert a valid name.' });
    }
    await con.promise().query('UPDATE authors SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    res.json('Author updated');
}

module.exports.changeImage = async (req, res) => {
    let image = process.env.CLOUDINARY_PROFILE_URL;
    if (req.file) {
        image = req.file.path;
    }
    const { id } = req.params;
    const [oldRows] = await con.promise().query('SELECT image FROM authors WHERE id = ?', [id]);
    const oldImageUrl = oldRows[0].image;
    const oldPublicId = oldImageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
    await con.promise().query('UPDATE authors SET image = ? WHERE id = ?', [image, id]);
    const [rows] = await con.promise().query('SELECT image FROM authors WHERE id = ?', [id]);
    const imageUrl = rows[0].image;
    const publicId = imageUrl.split('/').slice(-2).join('/').split('.').slice(0, -1).join('.');
    if (publicId !== oldPublicId && oldPublicId !== process.env.CLOUDINARY_PROFILE_ID) {
        await cloudinary.uploader.destroy(oldPublicId);
    }
    res.json('Image updated');
};