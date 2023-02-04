const houseController = require('../controllers/houseController');
const authMiddleware = require('../middleware/authMiddleware');
const router = require('express').Router();

router.post('/', authMiddleware.veriryToken, houseController.addNewHouse);
router.put('/update-member/:houseId', authMiddleware.veriryToken, houseController.addMemberToHouse);
router.put('/delete-member/:houseId/:userId', authMiddleware.veriryToken, houseController.deleteMemberToHouse);
router.put('/update-house/:houseId', authMiddleware.veriryToken, houseController.updateHouseInfo);
router.get('/events/:houseId', authMiddleware.veriryToken, houseController.getEvents);
router.get('/:houseId', authMiddleware.veriryToken, houseController.getHouseInfo);

module.exports = router;
