const deviceControler = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = require('express').Router();

router.post('/', authMiddleware.veriryToken, deviceControler.addDevice);
router.get('/', authMiddleware.veriryToken, deviceControler.getDevices);
router.get('/events', authMiddleware.veriryToken, deviceControler.getDeviceEvents);
router.put('/:id', authMiddleware.veriryToken, deviceControler.updateDeviceById);
router.delete('/:id', authMiddleware.veriryToken, deviceControler.deleteDeviceById);

module.exports = router;
