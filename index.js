require('dotenv').config();
const express = require("express");
const app = express();
const port = process.env.PORT;
const cookieParser = require('cookie-parser');
const ExpressError = require('./utils/ExpressError.js');
const cors = require('cors');
require('./models/Author');
require('./models/Book');
const userRoutes = require('./routes/users');
require('./models/Rent');
require('./models/Comment');

app.use(cors());

app.use(cookieParser());

app.use(express.urlencoded( {extended: true}));

const authorRoutes = require('./routes/authors');
const bookRoutes = require('./routes/books');
const commentRoutes = require('./routes/comments');
const rentRoutes = require('./routes/rents');

app.use('/authors', authorRoutes);
app.use('/books', bookRoutes);
app.use('/', userRoutes, rentRoutes);
app.use('/books/:id/comments', commentRoutes);

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
  });
  
  app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Oh no, something went wrong!';
    res.status(statusCode).json({ error: err.message });
  });

app.listen(port, () => {
    console.log("App listening on port", port);
});