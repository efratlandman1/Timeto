const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    used: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema, 'password_reset_tokens');

module.exports = PasswordResetToken; 