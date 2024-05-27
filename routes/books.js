const express = require("express");
const router = express.Router();
const books = require('../controllers/books');
const jwtAuth = require('../middlewares/jwtAuth');
const isAdmin = require('../middlewares/isAdmin');
const multer = require('multer');
const {storage} = require('../cloudinary');
const upload = multer({ storage });

router.get('/', books.getBooks);
router.post('/', jwtAuth, isAdmin, upload.single('image'), books.createBook);
router.delete('/:id', jwtAuth, isAdmin, books.deleteBook);
router.put('/:id', jwtAuth, isAdmin, books.updateBook);
router.put('/:id/image', jwtAuth, isAdmin, upload.single('image'), books.changeImage);
router.get('/:id', books.showBook);

module.exports = router;