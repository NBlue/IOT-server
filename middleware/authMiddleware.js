const jwt = require('jsonwebtoken');

const authMiddleware = {
    veriryToken: (req, res, next) => {
        const token = req.headers.token;

        if (token) {
            const accessToken = token.split(' ')[1];
            jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, admin) => {
                if (err) {
                    return res.status(403).json({ success: false, message: 'Token is not valid!' }); // Token da het han or ko dung
                }
                req.admin = admin;
                next();
            });
        } else {
            return res.status(401).json({ success: false, message: 'You are not authenticated!' });
        }
    },
};

module.exports = authMiddleware;
