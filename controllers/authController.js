const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Admin = require('../models/Admin');
const House = require('../models/House');
const DeviceType = require('../models/DeviceType');

let refeshTokens = [];

const authController = {
    // REGISTER
    register: async (req, res) => {
        try {
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

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

            // Create 1 house while admin register
            const newHouse = new House({
                name: `${req.body.username} House`,
                password: '00000000',
                width: 0,
                height: 0,
                device_types: [...device_ids],
            });
            let house = await newHouse.save();

            const newAdmin = new Admin({
                ...req.body,
                password: hashedPassword,
                isAdmin: true,
                houses: [house._id],
            });

            const admin = await newAdmin.save();
            house = await house.updateOne({ $push: { admins: admin._id } });

            return res.status(200).json({
                success: true,
                admin,
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    // GENERATEACCESSTOKEN
    generateAccessToken: (account) => {
        return jwt.sign(
            {
                id: account.id,
                houseId: account.houses[0],
                isAdmin: account.isAdmin,
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30d' }
        );
    },

    generateRefeshToken: (account) => {
        return jwt.sign(
            {
                id: account.id,
                houseId: account.houses[0],
                isAdmin: account.isAdmin,
            },
            process.env.REFESH_TOKEN_SECRET,
            { expiresIn: '365d' }
        );
    },

    // LOGIN
    login: async (req, res) => {
        try {
            const admin = await Admin.findOne({ username: req.body.username }).populate({
                path: 'houses',
                model: 'House',
            });
            if (!admin)
                return res.status(404).json({
                    success: false,
                    message: 'Wrong username',
                });

            const validPassword = await bcrypt.compare(req.body.password, admin.password);
            if (!validPassword)
                return res.status(404).json({
                    success: false,
                    message: 'Wrong password',
                });

            //Login success
            if (admin && validPassword) {
                const accessToken = authController.generateAccessToken(admin);

                const refeshToken = authController.generateRefeshToken(admin);
                res.cookie('refeshToken', refeshToken, {
                    httpOnly: true,
                    secure: false,
                    path: '/',
                    sameSite: 'strict',
                });
                refeshTokens.push(refeshToken);

                const { password, ...others } = admin._doc;
                return res.status(200).json({
                    success: true,
                    admin: {
                        ...others,
                        accessToken,
                    },
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, error: error });
        }
    },

    requestRefeshToken: async (req, res) => {
        const refeshToken = req.cookies.refeshToken;
        console.log(refeshToken);
        if (!refeshToken)
            return res.status(401).json({
                success: false,
                message: 'You are not authenticated!',
            });

        if (!refeshTokens.includes(refeshToken))
            return res.status(403).json({
                success: false,
                message: 'Refesh token is not valid',
            });

        jwt.verify(refeshToken, process.env.REFESH_TOKEN_SECRET, (err, admin) => {
            if (err) console.log({ err });

            refeshTokens = refeshTokens.filter((token) => token !== refeshToken);

            const newAccessToken = authController.generateAccessToken(admin);
            const newRefeshToken = authController.generateRefeshToken(admin);
            refeshTokens.push(newRefeshToken);
            res.cookie('refeshToken', newRefeshToken, {
                httpOnly: true,
                secure: false,
                path: '/',
                sameSite: 'strict',
            });

            return res.status(200).json({ success: true, accessToken: newAccessToken });
        });
    },

    // LOGOUT
    logout: async (req, res) => {
        res.clearCookie('refeshToken');
        refeshTokens = refeshTokens.filter((token) => token !== req.cookies.refeshToken);
        return res.status(200).json({ success: true, message: 'Logged out success!' });
    },
};

module.exports = authController;
