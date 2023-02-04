const deviceControler = require('../controllers/deviceController');
const authMiddleware = require('../middleware/authMiddleware');

const router = require('express').Router();

router.post('/:houseId', authMiddleware.veriryToken, deviceControler.addDevice);
router.get('/:houseId', authMiddleware.veriryToken, deviceControler.getDevices);
router.put('/:deviceId', authMiddleware.veriryToken, deviceControler.updateDeviceById);
router.delete('/:deviceId', authMiddleware.veriryToken, deviceControler.deleteDeviceById);

module.exports = router;
