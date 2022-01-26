const mongoose = require("mongoose")
const Joi = require("joi")

const feedbackSchema = new mongoose.Schema({
  feedback: String,
  orderId: {
    type: mongoose.Types.ObjectId,
    ref: "Order",
  },
})

const feedbackJoi = Joi.object({
  feedback: Joi.string().min(5).max(100).required(),
})

const FeedBack = mongoose.model("FeedBack", feedbackSchema)

module.exports.FeedBack = FeedBack
module.exports.feedbackJoi = feedbackJoi
