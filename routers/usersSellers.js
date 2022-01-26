const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const router = express.Router()
const { userSellerJoi, UserSeller, loginSellerJoi, editSellerJoi } = require("../models/UserSeller")
const validteBody = require("../middlewere/validateBody")
const nodemailer = require("nodemailer")
const checkTokenUser = require("../middlewere/checkTokenUser")
const { User } = require("../models/User")
const checkSeller = require("../middlewere/checkSeller")
const validateId = require("../middlewere/validateId")
const { Order, statusJoi } = require("../models/Order")
const { Product } = require("../models/Product")

router.post("/signup", validteBody(userSellerJoi), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      commercialRegister,
      phone,
      aboutYourBusiness,
      photo,
      nameStore,
    } = req.body

    const userFound = await UserSeller.find({ $or: [{ email }, { username }] })
    const onlyUser = await User.find({ $or: [{ email }, { username }] })

    if (onlyUser.length > 0) return res.status(400).send("user already reqistered")
    if (userFound.length > 0) return res.status(400).send("user already reqistered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new UserSeller({
      firstName,
      lastName,
      username,
      email,
      password: hash,
      photo,
      nameStore,
      commercialRegister,
      phone,
      aboutYourBusiness,
      emailVerified: false,
    })

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    })
    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, { expiresIn: "15d" })

    await transporter.sendMail({
      from: '"Saudi Hand made <abcdrahf@gmail.com>"',
      to: email,
      subject: "Email verification",

      html: `hello, please cheack on this link to verify your email.
      <a href="http://localhost:3000/email_verified_seller/${token}">verify email</a>`,
    })
    await user.save()
    delete user._doc.password
    res.send("user created ,please check your email for verification link")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/verify_email_seller/:token", async (req, res) => {
  try {
    const decrytedToken = jwt.verify(req.params.token, process.env.JWT_KEY)
    const userId = decrytedToken.id

    const user = await UserSeller.findByIdAndUpdate(userId, { $set: { emailVerified: true } })
    if (!user) return res.status(404).send("token not found")

    res.send("user verified")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/login", validteBody(loginSellerJoi), async (req, res) => {
  try {
    const { email, password, username } = req.body

    const user = await UserSeller.findOne({ $or: [{ email }, { username }] })
    if (!user) return res.status(400).send("user not found")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")
    if (!user.emailVerified) return res.status(403).send("user not verified ,please check your email")
    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.get("/profile", checkSeller, async (req, res) => {
  try {
    const user = await UserSeller.findById(req.userId).populate("products")
    res.json(user)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
router.get("/profile/seller/:sellerId", validateId("sellerId"), async (req, res) => {
  try {
    const user = await UserSeller.findById(req.params.sellerId).select("-__v -password ").populate("products")
    res.json(user)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.put("/profile-edit", checkSeller, validteBody(editSellerJoi), async (req, res) => {
  try {
    const { firstName, lastName, username, email, photo, phone, nameStore, aboutYourBusiness } = req.body

    // const salt = await bcrypt.genSalt(10)
    // const hash = await bcrypt.hash(password, salt)

    const user = await UserSeller.findByIdAndUpdate(
      req.userId,
      {
        $set: { firstName, lastName, username, email, photo, phone, nameStore, aboutYourBusiness },
      },
      { new: true }
    )
    res.json(user)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.delete("/profile/:profileId", checkSeller, validateId("profileId"), async (req, res) => {
  try {
    const user = await UserSeller.findById(req.params.profileId)
    if (!user) return res.status(404).send("user is not found")

    await UserSeller.findByIdAndRemove(req.params.profileId)
    await Product.deleteMany({ userSeller: req.params.profileId })
  } catch (error) {
    res.status(500).send(error.message)
  }
})

//------------------------------------like seller---------------------//
router.get("/:sellerId/likes", checkTokenUser, validateId("sellerId"), async (req, res) => {
  try {
    let seller = await UserSeller.findById(req.params.sellerId)
    if (!seller) return res.status(404).send("seller is not found")

    const userFound = seller.likesSeller.find(like => like == req.userId)

    if (userFound) {
      await UserSeller.findByIdAndUpdate(req.params.sellerId, { $pull: { likesSeller: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $pull: { likesSeller: req.params.sellerId } })
      res.send("remove like")
    } else {
      await UserSeller.findByIdAndUpdate(req.params.sellerId, { $push: { likesSeller: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $push: { likesSeller: req.params.sellerId } })
      res.send("like add")
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

//------------------------order--------------------//
router.get("/order", checkSeller, async (req, res) => {
  try {
    const order = await Order.find({ sellerId: req.userId }).populate("userId").populate("productId")
    res.json(order)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.put("/order/:orderId", checkSeller, validateId("orderId"), validteBody(statusJoi), async (req, res) => {
  let { status } = req.body
  const order = await Order.findById(req.params.orderId)
  if (order.sellerId != req.userId) return res.status(403).send("unauthorazed action ")
  const product = await Product.findById(order.productId)
  if (order.quantity > product.quantity) {
    return res.status(400).send("Quantity not available ")
  } else {
    await Product.findByIdAndUpdate(order.productId, { $set: { quantity: product.quantity - order.quantity } })
  }
  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.orderId,
    {
      $set: { status },
    },
    { new: true }
  )
  res.json(updatedOrder)
})
module.exports = router
