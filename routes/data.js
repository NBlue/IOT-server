const dataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = require('express').Router();

router.get('/:houseId', authMiddleware.veriryToken, dataController.getDeviceData);

module.exports = router;
