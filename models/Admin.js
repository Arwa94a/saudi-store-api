const mongoose = require("mongoose")
const Joi = require("joi")

const admainSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  password: String,
  photo: String,
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
})

const admainJoi = Joi.object({
  firstName: Joi.string().min(3).max(10).required(),
  lastName: Joi.string().min(3).max(10).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(6).max(15).required(),
  photo: Joi.string().uri().min(20).max(1000).required(),
  username: Joi.string().min(5).max(20).required(),
})

const Admin = mongoose.model("Admin", admainSchema)

module.exports.Admin = Admin
module.exports.admainJoi = admainJoi
