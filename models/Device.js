const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        required: true,
        default: true,
    },
    spaceX: {
        type: Number,
        required: true,
    },
    spaceY: {
        type: Number,
        required: true,
    },
    spaceZ: {
        type: Number,
        required: true,
    },
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
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeviceType',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Device', deviceSchema);
