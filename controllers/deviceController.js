const DeviceType = require('../models/DeviceType');
const Device = require('../models/Device');
const House = require('../models/House');

const deviceControler = {
    //  POST ADD DEVICE
    addDevice: async (req, res) => {
        try {
            const house = await House.findById(req.params.houseId);
            if (!house) return res.status(404).json({ success: false, message: 'House is not found!' });

            const newDeviceData = new Device({
                name: req.body.name,
                active: true,
                spaceX: req.body.spaceX,
                spaceY: req.body.spaceY,
                spaceZ: 0,
            });

            for (let type_id of house.device_types) {
                const deviceType = await DeviceType.findOne({ _id: type_id, type_name: req.body.typeDevice });

                if (!deviceType) continue;
                else {
                    const device = await newDeviceData.save();
                    const updatedDeviceType = await DeviceType.findByIdAndUpdate(
                        type_id,
                        { $addToSet: { devices: device._id } },
                        { new: true }
                    );

                    return res.status(200).json({
                        success: true,
                        message: 'Add Device successfully!',
                        device,
                        updatedDeviceType,
                    });
                }
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // GET ALL DEVICES
    getDevices: async (req, res) => {
        try {
            const houseData = await House.findById(req.params.houseId).populate({
                path: 'device_types',
                select: '-datas',
                populate: { path: 'devices', model: 'Device' },
            });

            const deviceDatas = [];
            houseData.device_types.map((deviceType) => {
                const { type_name, min, max, devices } = deviceType._doc;
                return devices.map((device) => deviceDatas.push({ ...device._doc, type_name, min, max }));
            });

            return res.status(200).json({
                success: true,
                devices: deviceDatas,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // PUT UPDATE DEVICE BY id
    updateDeviceById: async (req, res) => {
        try {
            const updateDevice = await Device.findByIdAndUpdate(
                req.params.deviceId,
                {
                    spaceX: req.body.spaceX,
                    spaceY: req.body.spaceY,
                    spaceZ: req.body.spaceZ,
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                updateDevice,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // DELETE DEVICE
    deleteDeviceById: async (req, res) => {
        try {
            await DeviceType.updateMany({ devices: req.params.deviceId }, { $pull: { devices: req.params.deviceId } }); // Find and Delete deviceId in devices[]
            await Device.findByIdAndDelete(req.params.deviceId);
            res.status(200).json({
                success: true,
                message: 'Device deleted successfully!',
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },
};

module.exports = deviceControler;
