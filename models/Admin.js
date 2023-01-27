const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    houses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'House',
        },
    ],
});

module.exports = mongoose.model('Admin', adminSchema);
