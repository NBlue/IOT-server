const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = require('express').Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refesh', authController.requestRefeshToken);
router.post('/logout', authMiddleware.veriryToken, authController.logout);

module.exports = router;
