const House = require('../models/House');

const houseController = {
    // PUT RESIZE HOUSE WIDTH HIGHT
    resizeHouse: async (req, res) => {
        try {
            const updatedHouse = await House.findByIdAndUpdate(
                req.admin.houseId,
                { width: req.body.width, height: req.body.height },
                { new: true }
            );

            if (!updatedHouse) return res.status(404).json({ success: false, message: 'House not found' });

            return res.status(200).json({
                success: true,
                updatedHouse,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },
};

module.exports = houseController;
