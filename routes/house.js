const houseController = require('../controllers/houseController');
const authMiddleware = require('../middleware/authMiddleware');
const router = require('express').Router();

router.put('/', authMiddleware.veriryToken, houseController.resizeHouse);

module.exports = router;
