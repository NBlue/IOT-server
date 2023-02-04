const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
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
    houses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'House',
        },
    ],
});

module.exports = mongoose.model('User', userSchema);
