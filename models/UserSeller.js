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
  nameStore: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  phone: {
    type: Number,
    unique: true,
  },
  photo: String,
  password: String,
  products: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Product",
    },
  ],
  commercialRegister: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  order: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Order",
    },
  ],
  likesSeller: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  aboutYourBusiness: String,

  emailVerified: {
    type: Boolean,
    default: false,
  },
})

const userSellerJoi = Joi.object({
  firstName: Joi.string().min(3).max(10).required(),
  lastName: Joi.string().min(3).max(10).required(),
  username: Joi.string().min(5).max(20).required(),
  phone: Joi.number().min(10).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(6).max(15).required(),
  photo: Joi.string().uri().min(20).max(1000).required(),
  nameStore: Joi.string().min(5).max(20).required(),
  aboutYourBusiness: Joi.string().min(20).max(100).required(),
  commercialRegister: Joi.string().min(10).max(10).required(),
})

const editSellerJoi = Joi.object({
  firstName: Joi.string().min(3).max(10),
  lastName: Joi.string().min(3).max(10),
  username: Joi.string().min(5).max(20),
  email: Joi.string().email({ tlds: { allow: false } }),
  phone: Joi.number().min(10),
  password: Joi.string().min(6).max(15),
  photo: Joi.string().uri().min(20).max(1000),
  nameStore: Joi.string().min(5).max(20),
  aboutYourBusiness: Joi.string().min(20).max(100),
})

const loginSellerJoi = Joi.object({
  username: Joi.string().min(5).max(20).required(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(6).max(15).required(),
})

const UserSeller = mongoose.model("UserSeller", userSchema)

module.exports.UserSeller = UserSeller
module.exports.userSellerJoi = userSellerJoi
module.exports.loginSellerJoi = loginSellerJoi
module.exports.editSellerJoi = editSellerJoi
