const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const House = require('../models/House');
const DeviceType = require('../models/DeviceType');

let refeshTokens = [];

const authController = {
    // REGISTER
    registerUser: async (req, res) => {
        try {
            // Check username exist
            const findUser = await User.findOne({ username: req.body.username });
            if (findUser) {
                return res.status(409).json({
                    success: false,
                    message: 'username already registered!',
                });
            }
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

            const newUser = new User({
                ...req.body,
                password: hashedPassword,
            });

            const user = await newUser.save();

            return res.status(200).json({
                success: true,
                user,
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
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30d' }
        );
    },

    generateRefeshToken: (account) => {
        return jwt.sign(
            {
                id: account.id,
            },
            process.env.REFESH_TOKEN_SECRET,
            { expiresIn: '365d' }
        );
    },

    // LOGIN
    loginUser: async (req, res) => {
        try {
            const user = await User.findOne({ username: req.body.username }).populate({
                path: 'houses',
                model: 'House',
                select: '-events',
            });
            if (!user)
                return res.status(404).json({
                    success: false,
                    message: 'Wrong username',
                });

            const validPassword = await bcrypt.compare(req.body.password, user.password);
            if (!validPassword)
                return res.status(404).json({
                    success: false,
                    message: 'Wrong password',
                });

            if (user && validPassword) {
                const accessToken = authController.generateAccessToken(user);

                const refeshToken = authController.generateRefeshToken(user);
                res.cookie('refeshToken', refeshToken, {
                    httpOnly: true,
                    secure: false,
                    path: '/',
                    sameSite: 'strict',
                });
                refeshTokens.push(refeshToken);
                // Check account da ket noi voi nha nam nao chua
                if (user.houses.length === 0)
                    return res
                        .status(200)
                        .json({ success: true, message: 'Account is not linked to home!', accessToken });
                else {
                    const { password, ...others } = user._doc;
                    return res.status(200).json({
                        success: true,
                        user: {
                            ...others,
                            accessToken,
                        },
                    });
                }
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
    logoutUser: async (req, res) => {
        res.clearCookie('refeshToken');
        refeshTokens = refeshTokens.filter((token) => token !== req.cookies.refeshToken);
        return res.status(200).json({ success: true, message: 'Logged out success!' });
    },
};

module.exports = authController;
