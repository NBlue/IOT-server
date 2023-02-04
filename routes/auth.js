const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = require('express').Router();

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/refesh', authController.requestRefeshToken);
router.post('/logout', authMiddleware.veriryToken, authController.logoutUser);

module.exports = router;
