const mongoose = require("mongoose")
const Joi = require("joi")

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  rating: Number,
})

const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  likes: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Comment",
    },
  ],
  ratings: [ratingSchema],
  ratingAverage: {
    type: Number,
    default: 0,
  },
  userSeller: {
    type: mongoose.Types.ObjectId,
    ref: "UserSeller",
  },
  price: Number,
  location: String,
  quantity: Number,
  type: {
    type: String,
    enum: ["Food", "Clothes", "Foodtruck", "Building"],
  },
})

const productJoi = Joi.object({
  title: Joi.string().min(2).max(15).required(),
  description: Joi.string().min(5).max(225).required(),
  image: Joi.string().uri().max(255).required(),
  price: Joi.number().min(1).required(),
  quantity: Joi.number().min(1).required(),
  userSeller: Joi.objectId(),
  location: Joi.string().uri().max(255),
  type: Joi.string().valid("Food", "Clothes", "Foodtruck", "Building").required(),
})

const editProductJoi = Joi.object({
  title: Joi.string().min(5).max(15),
  description: Joi.string().min(10).max(225),
  image: Joi.string().uri().max(255),
  quantity: Joi.number().min(1),
  price: Joi.number().min(1),
  userSeller: Joi.objectId(),
  location: Joi.string().uri().max(255),
})

const ratingJoi = Joi.object({
  rating: Joi.number().min(0).max(5).required(),
})

const Product = mongoose.model("Product", productSchema)

module.exports.Product = Product
module.exports.productJoi = productJoi
module.exports.editProductJoi = editProductJoi
module.exports.ratingJoi = ratingJoi
