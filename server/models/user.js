const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    phone:     { type: String },
    nickname:  { type: String },
    password:  { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'manager', 'end-user'],
        default: 'end-user'
    }
  }, {
    timestamps: true  // הוספת השדות createdAt ו- updatedAt אוטומטית
  });

const Users = mongoose.model('users', usersSchema);

module.exports = Users;
