const mongoose = require("mongoose")
const Joi = require("joi")

const orderSchema = new mongoose.Schema(
  {
    quantity: Number,
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
    },
    sellerId: {
      type: mongoose.Types.ObjectId,
      ref: "UserSeller",
    },
    status: {
      type: String,
      enum: ["Pending", "Progress", "Ready", "Delivered", "Cancelled"],
      default: "Pending",
    },
    location: String,
  },
  { timestamps: true }
)

const orderJoi = Joi.object({
  quantity: Joi.number().min(1).required(),
  location: Joi.string().min(1).required(),
})

const orderJoiEdit = Joi.object({
  quantity: Joi.number().min(1).required(),
})

const orderCartJoi=Joi.object({
  location: Joi.string().min(1).required(),
  orders:Joi.array().items({
    productId:Joi.objectId().required(),
    quantity: Joi.number().min(1).required(),
  }).min(1)
})
const statusJoi = Joi.object({
  status: Joi.string().valid("Progress", "Ready", "Delivered", "Cancelled").required(),
})
const Order = mongoose.model("Order", orderSchema)

module.exports.Order = Order
module.exports.orderJoi = orderJoi
module.exports.orderJoiEdit = orderJoiEdit
module.exports.orderCartJoi = orderCartJoi
module.exports.statusJoi = statusJoi
