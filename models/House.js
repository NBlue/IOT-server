const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    width: {
        type: Number,
        required: true,
    },
    height: {
        type: Number,
        required: true,
    },
    admins: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin',
        },
    ],
    device_types: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DeviceType',
        },
    ],
});

module.exports = mongoose.model('House', houseSchema);
