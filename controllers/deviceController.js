const moment = require('moment-timezone');
const DeviceType = require('../models/DeviceType');
const Device = require('../models/Device');
const House = require('../models/House');

const deviceControler = {
    //  POST ADD DEVICE
    addDevice: async (req, res) => {
        try {
            console.log(req.admin); // Lay tu verify token

            const house = await House.findById(req.admin.houseId);
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
                        {
                            devices: [...deviceType.devices, device._id],
                        },
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
            const houseData = await House.findById(req.admin.houseId).populate({
                path: 'device_types',
                populate: { path: 'devices', model: 'Device' },
            });

            const deviceDatas = [];
            houseData.device_types.map((deviceType) => {
                const { type_name, min, max, datas, devices } = deviceType._doc;
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

    // GET ALL DEVICE EVENTS
    getDeviceEvents: async (req, res) => {
        try {
            const houseData = await House.findById(req.admin.houseId).populate({
                path: 'device_types',
                populate: { path: 'devices', model: 'Device' },
            });

            let eventArr = [];
            houseData.device_types.forEach((deviceTypeData) => {
                const { devices, ...other } = deviceTypeData._doc;
                const event = devices.forEach((device) => {
                    const { events, ...other } = device._doc;
                    eventArr = [...eventArr, ...events];
                });
            });

            eventArr = eventArr
                .sort(function (a, b) {
                    return new Date(b.created_at) - new Date(a.created_at);
                })
                .map((event) => {
                    const vnTime = moment.tz(event.created_at, 'Asia/Ho_Chi_Minh').format('HH:mm DD-MM-YYYY');
                    return { ...event._doc, created_at: vnTime };
                });

            return res.status(200).json({
                success: true,
                events: eventArr,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // PUT UPDATE DEVICE BY id
    updateDeviceById: async (req, res) => {
        try {
            const updateDevice = await Device.findByIdAndUpdate(
                req.params.id,
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
            await DeviceType.updateMany({ devices: req.params.id }, { $pull: { devices: req.params.id } }); // Find and Delete deviceId in devices[]
            await Device.findByIdAndDelete(req.params.id);
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
