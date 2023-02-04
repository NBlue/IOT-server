const mongoose = require('mongoose');

const houseSchema = new mongoose.Schema({
    name: {
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
    members: [
        {
            _id: false,
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            role: {
                type: String,
                enum: ['admin', 'member'],
                default: 'member',
            },
        },
    ],
    device_types: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DeviceType',
        },
    ],
    events: [
        {
            message: {
                type: String,
            },
            created_at: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

module.exports = mongoose.model('House', houseSchema);
