const express = require("express");
const router = express.Router();
const rents = require('../controllers/rents');
const jwtAuth = require('../middlewares/jwtAuth');
const getIdFromToken = require('../middlewares/getIdFromToken');
const isAdmin = require('../middlewares/isAdmin');
const isRenter = require('../middlewares/isRenter');

router.get('/available', rents.getAvailableBooks);
router.get('/allRents', jwtAuth, isAdmin, rents.allRents);
router.get('/myRents', jwtAuth, getIdFromToken, rents.myRents);
router.post('/:id/rent', jwtAuth, getIdFromToken, rents.createRent);
router.post('/return/:id', jwtAuth, isRenter, rents.returnRent);

module.exports = router;