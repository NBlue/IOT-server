const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = require('express').Router();

router.get('/', authMiddleware.veriryToken, dataController.getDeviceData);

module.exports = router;
