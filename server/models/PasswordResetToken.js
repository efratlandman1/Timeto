const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
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
}, {
    autoIndex: true,
    timestamps: true
});

passwordResetTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema, 'password_reset_tokens');

module.exports = PasswordResetToken; 