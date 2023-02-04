const mongoose = require('mongoose');

const deviceTypeSchema = new mongoose.Schema({
    type_name: {
        type: String,
        enum: ['Temp', 'Humi', 'Oxi', 'Sun'],
    },
    min: {
        type: Number,
        required: true,
    },
    max: {
        type: Number,
        required: true,
    },
    datas: [
        {
            data: {
                type: Number,
            },
            created_at: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    devices: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Device',
        },
    ],
    house: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'House',
    },
});

module.exports = mongoose.model('DeviceType', deviceTypeSchema);
