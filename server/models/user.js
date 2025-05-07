const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    phone:     { type: String },
    nickname:  { type: String },
    password:  { type: String, required: true }
  }, {
    timestamps: true  // הוספת השדות createdAt ו- updatedAt אוטומטית
  });

const Users = mongoose.model('Users', usersSchema);

module.exports = Users;
