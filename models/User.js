const mongoose = require("mongoose")
const Joi = require("joi")

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
  },
  password: String,
  phone: {
    type: Number,
    unique: true,
  },
  order: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Order",
    },
  ],
  photo: String,
  likes: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Product",
    },
  ],
  likesSeller: [
    {
      type: mongoose.Types.ObjectId,
      ref: "UserSeller",
    },
  ],
  role: {
    type: String,
    enum: ["Admin", "User"],
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
})

const signupJoi = Joi.object({
  firstName: Joi.string().min(3).max(10).required(),
  lastName: Joi.string().min(3).max(10).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(6).max(15).required(),
  photo: Joi.string().uri().min(20).max(1000).required(),
  username: Joi.string().min(5).max(20).required(),
  phone: Joi.string().min(10).max(10).required(),
})

const loginJoi = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  username: Joi.string().min(5).max(20).required(),
  password: Joi.string().min(6).max(15).required(),
})

const profileJoi = Joi.object({
  firstName: Joi.string().min(3).max(10).required(),
  lastName: Joi.string().min(3).max(10).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(6).max(15).required(),
  photo: Joi.string().uri().min(20).max(1000).required(),
  username: Joi.string().min(5).max(20).required(),
  phone: Joi.number().min(10).required(),
})
const profileJoiEdit = Joi.object({
  firstName: Joi.string().min(3).max(10),
  lastName: Joi.string().min(3).max(10),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    ,
  photo: Joi.string().uri().min(20).max(1000),
  username: Joi.string().min(5).max(20),
  phone: Joi.number().min(10),
})

const forogotPasswordJoi = Joi.object({
  email: Joi.string().email().required(),
})
const resetPasswordJoi = Joi.object({
  password: Joi.string().required(),
})

const User = mongoose.model("User", userSchema)

module.exports.User = User
module.exports.signupJoi = signupJoi
module.exports.loginJoi = loginJoi
module.exports.profileJoi = profileJoi
module.exports.profileJoiEdit = profileJoiEdit
module.exports.forogotPasswordJoi = forogotPasswordJoi
module.exports.resetPasswordJoi = resetPasswordJoi
