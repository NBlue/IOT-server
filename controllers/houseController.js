const moment = require('moment-timezone');

const DeviceType = require('../models/DeviceType');
const House = require('../models/House');
const User = require('../models/User');

const houseController = {
    // CREATE NEW HOUSE
    addNewHouse: async (req, res) => {
        try {
            // Create 4 device type and save to house
            const types = [
                { type_name: 'Temp', min: 15, max: 30 },
                { type_name: 'Humi', min: 40, max: 60 },
                { type_name: 'Oxi', min: 20, max: 30 },
                { type_name: 'Sun', min: 5000, max: 9000 },
            ];

            const promises = types.map((type) => {
                const newType = new DeviceType(type);
                return newType.save();
            });
            const savedTypes = await Promise.all(promises);
            const device_ids = savedTypes.map((type) => type._id);

            const newHouse = await House({
                ...req.body,
                members: [{ user: req.user.id, role: 'admin' }],
                device_types: [...device_ids],
            });

            const house = await newHouse.save();

            const user = await User.findByIdAndUpdate(
                req.user.id,
                { $push: { houses: house._id } },
                { new: true }
            ).populate({
                path: 'houses',
                model: 'House',
                select: '-events',
            });

            return res.status(200).json({
                success: true,
                user,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // DELETE HOUSE - Phai xoa cac thiet bi lien quan nua
    // deleteHouse: async (req, res) => {
    //     try {
    //         await User.updateMany({ houses: req.params.houseId }, { $pull: { devices: req.params.houseId } });
    //         await House.findByIdAndDelete(req.params.houseId);
    //         res.status(200).json({
    //             success: true,
    //             message: 'House deleted successfully!',
    //         });
    //     } catch (error) {
    //         return res.status(500).json({ success: false, error: error });
    //     }
    // },

    // ADD MEMBERS TO HOUSE - UPDATE HOUSE
    addMemberToHouse: async (req, res) => {
        try {
            const house = await House.findOne({
                _id: req.params.houseId,
                members: { $elemMatch: { user: req.user.id } },
            }).exec();

            if (!house) return res.status(404).json({ success: false, message: 'House not found!' });

            // const role = house._doc.members.find((member) => member.user === req.user.id);
            const role = house.members.filter((member) => member.user.equals(req.user.id))[0].role;

            if (role === 'member')
                return res.status(200).json({
                    success: false,
                    message: 'My role is member',
                });
            else {
                const findUser = await User.findOne({ username: req.body.username }).exec();
                console.log({ findUser });
                if (!findUser)
                    return res.status(404).json({
                        success: false,
                        message: 'Username is not register!',
                    });

                if (house.members.filter((member) => member.user.equals(findUser._id))[0])
                    return res.status(404).json({
                        success: false,
                        message: 'Account is member in your house!',
                    });

                //  Add to memmber[] and update house cua username do
                await house.updateOne({
                    $addToSet: {
                        members: {
                            user: findUser._id,
                            role: 'member',
                        },
                    },
                });
                await findUser.updateOne({ $addToSet: { houses: house._id } });

                return res.status(200).json({
                    success: true,
                    message: 'Add member success!',
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // DELETE MEMBER IN HOUSE
    deleteMemberToHouse: async (req, res) => {
        try {
            const house = await House.findOne({
                _id: req.params.houseId,
                members: { $elemMatch: { user: req.user.id } },
            }).exec();

            if (!house) return res.status(404).json({ success: false, message: 'House not found!' });

            const role = house.members.filter((member) => member.user.equals(req.user.id))[0].role;

            if (role === 'member')
                return res.status(200).json({
                    success: false,
                    message: 'My role is member',
                });
            else {
                await house.updateOne({
                    $pull: {
                        members: {
                            user: req.params.userId,
                            role: 'member',
                        },
                    },
                });
                await User.findById(req.params.userId).updateOne({ $pull: { houses: house._id } });

                return res.status(200).json({
                    success: true,
                    message: `Delete member success!`,
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // GET HOUSE INFO
    getHouseInfo: async (req, res) => {
        try {
            // const house = await House.findById(req.params.houseId).populate({
            //     path: 'device_types',
            //     model: 'DeviceType',
            //     select: '-datas -devices -events',
            // });
            const house = await House.findById(req.params.houseId).select('-events').populate({
                path: 'device_types',
                model: 'DeviceType',
                select: '-datas -devices',
            });
            if (!house) return res.status(404).json({ success: false, message: 'House not found' });

            return res.status(200).json({
                success: true,
                house,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // PUT RESIZE HOUSE WIDTH HIGHT ADN MIN MAX DEVICETYPE
    updateHouseInfo: async (req, res) => {
        try {
            const updatedHouse = await House.findByIdAndUpdate(
                req.params.houseId,
                { width: req.body.width, height: req.body.height },
                { new: true }
            ).populate({
                path: 'device_types',
                model: 'DeviceType',
            });

            if (!updatedHouse) return res.status(404).json({ success: false, message: 'House not found' });

            // Update nguong thiet bi
            const deviceTypes = updatedHouse.device_types;
            await Promise.all(
                deviceTypes.map(async (deviceType) => {
                    await DeviceType.findByIdAndUpdate(deviceType._id, {
                        min: req.body[`${deviceType.type_name}-min`],
                        max: req.body[`${deviceType.type_name}-max`],
                    });
                })
            );

            return res.status(200).json({
                success: true,
                message: 'Update House and Device Min Max successfully!',
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // GET EVENTS
    getEvents: async (req, res) => {
        try {
            const houseData = await House.findById(req.params.houseId).select('events');

            eventArr = houseData.events
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
};

module.exports = houseController;
