const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const router = express.Router()
const {
  User,
  signupJoi,
  loginJoi,
  profileJoi,
  forogotPasswordJoi,
  resetPasswordJoi,
  profileJoiEdit,
} = require("../models/User")
const validteBody = require("../middlewere/validateBody")
const nodemailer = require("nodemailer")
const checkTokenUser = require("../middlewere/checkTokenUser")
const checkAdmin = require("../middlewere/checkAdmin")
const { UserSeller } = require("../models/UserSeller")
const { Product } = require("../models/Product")
const validateId = require("../middlewere/validateId")
const { Order, orderJoi, orderCartJoi, orderJoiEdit } = require("../models/Order")
const { FeedBack, feedbackJoi } = require("../models/Feedback")
const { Comment } = require("../models/Comment")

router.post("/signup", validteBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, password, photo, username, phone } = req.body

    const userFound = await User.find({ $or: [{ email }, { username }] })
    const sellerUSer = await UserSeller.find({ $or: [{ email }, { username }] })
    if (userFound.length > 0) return res.status(400).send("user already reqistered")
    if (sellerUSer.length > 0) return res.status(400).send("user already reqistered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hash,
      photo,
      username,
      role: "User",
      phone,
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
      <a href="http://localhost:3000/email_verified/${token}">verify email</a>`,
    })
    await user.save()
    delete user._doc.password
    res.send("user created ,please check your email for verification link")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/verify_email/:token", async (req, res) => {
  try {
    const decrytedToken = jwt.verify(req.params.token, process.env.JWT_KEY)
    const userId = decrytedToken.id

    const user = await User.findByIdAndUpdate(userId, { $set: { emailVerified: true } })
    if (!user) return res.status(404).send("token not found")

    res.send("user verified")
  } catch (error) {
    res.status(500).send(error.message)
  }
})
router.post("/forgot-password", validteBody(forogotPasswordJoi), async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.Email,
        pass: process.env.PASSWORD,
      },
    })
    const token = jwt.sign({ id: user._id, forgotPassword: true }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    await transporter.sendMail({
      from: '"App Film <abcdrahf@gmail.com>"',
      to: email,
      subject: "Reset password",

      html: `hello, please cheack onthis link to reset your password.
  <a href="http://localhost:3000/reset-password/${token}">Reset password</a>`,
    })

    res.send("reset password link sent")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/reset-password/:token", validteBody(resetPasswordJoi), async (req, res) => {
  try {
    const decrytedToken = jwt.verify(req.params.token, process.env.JWT_SECRET_KEY)
    if (!decrytedToken.forgotPassword) return res.status(403).send("unauthorized action")

    const userId = decrytedToken.id

    const user = await User.findById(userId)
    if (!user) return res.status(404).send("token not found")

    const { password } = req.body
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    await User.findByIdAndUpdate(userId, { $set: { password: hash } })
    res.send("password reset")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/login", validteBody(loginJoi), async (req, res) => {
  try {
    const { email, password, username } = req.body

    const user = await User.findOne({ $or: [{ email }, { username }] })
    if (!user) return res.status(400).send("user not found")
    if (user.role === "Admin") return res.status(403).send("check again your user or password")

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

router.get("/profile", checkTokenUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("order")

    res.json(user)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.put("/profile", checkTokenUser, validteBody(profileJoiEdit), async (req, res) => {
  try {
    const { firstName, lastName, email, photo, username } = req.body

    // const salt = await bcrypt.genSalt(10)
    // const hash = await bcrypt.hash(password, salt)

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { firstName, lastName, email, photo, username } },
      { new: true }
    )
    res.json(user)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.delete("/profile/:profileuserId", validateId("profileuserId"), checkTokenUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.profileuserId)
    if (!user) return res.status(404).send("user is not found")
    await User.findByIdAndRemove(req.params.profileuserId)
    res.send("user removed")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

//-----------------------------------admin--------------------//

router.post("/admin/login", validteBody(loginJoi), async (req, res) => {
  try {
    const { email, password, username } = req.body

    const user = await User.findOne({ $or: [{ email }, { username }] })
    if (!user) return res.status(400).send("user not found")
    if (user.role != "Admin") return res.status(403).send("you are not admin")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")

    const token = jwt.sign({ id: user._id }, process.env.JWT_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.post("/add-admin", checkAdmin, validteBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, password, photo, username } = req.body

    const userFound = await User.find({ $or: [{ email }, { username }] })
    if (userFound.length > 0) return res.status(400).send("user already reqistered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hash,
      photo,
      username,
      role: "Admin",
    })
    await user.save()
    delete user._doc.password
    res.json(user)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/users", async (req, res) => {
  try {
    const users = await User.find().populate("order")
    res.json(users)
  } catch (error) {
    res.status(500).send(error.message)
  }
})
router.get("/seller", async (req, res) => {
  try {
    const seller = await UserSeller.find().populate("products").populate("order")
    res.json(seller)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.delete("/users/:userId", checkAdmin, validateId("userId"), async (req, res) => {
  try {
    await Comment.deleteMany({ id: req.params.userId })
    await Order.deleteMany({ id: req.params.userId })
    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).send("user is not found")
    if (user.roler === "Admin") return res.status(403).send("unauthorized action")
    await User.findByIdAndRemove(req.params.userId)
    res.send("user removed")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
router.delete("/seller/:sellerId", checkAdmin, validateId("sellerId"), async (req, res) => {
  try {
    const user = await UserSeller.findById(req.params.sellerId)
    if (!user) return res.status(404).send("user is not found")
    if (user.roler === "Admin") return res.status(403).send("unauthorized action")
    await UserSeller.findByIdAndRemove(req.params.sellerId)
    res.send("user removed")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
//-----------------------------------order------------------------//
router.get("/orders", checkAdmin, async (req, res) => {
  const orders = await Order.find().populate("userId").populate("productId").populate("sellerId")
  res.json(orders)
})

router.get("/myorder", checkTokenUser, async (req, res) => {
  const orders = await Order.find({ userId: req.userId }).populate("productId").populate("sellerId")
  res.json(orders)
})

// router.post("/:productId/order", checkTokenUser, validateId("productId"), validteBody(orderJoi), async (req, res) => {
//   try {
//     const { quantity, location } = req.body
//     const product = await Product.findById(req.params.productId)
//     if (!product) return res.status(404).send("product is not  found")
//     if (product.quantity < quantity) return res.status(400).send("Quantitiy not available")
//     const orderNew = new Order({
//       productId: req.params.productId,
//       userId: req.userId,
//       quantity,
//       sellerId: product.userSeller,
//       location,
//     })

//     await User.findByIdAndUpdate(req.userId, { $push: { order: orderNew._id }, new: true })
//     await UserSeller.findByIdAndUpdate(product.userSeller, { $push: { order: orderNew._id }, new: true })

//     await orderNew.save()
//     res.json(orderNew)
//   } catch (error) {
//     console.log(error.message)
//     res.status(500).send(error.message)
//   }
// })

router.put("/:orderId", checkTokenUser, validteBody(orderJoiEdit), validateId("orderId"), async (req, res) => {
  try {
    const { quantity } = req.body
    const product = await Product.find()
    if (!product) return res.status(404).send("product is not  found")
    const order = await Order.findById(req.params.orderId)
    if (order.status !== "Pending") return res.status(403).send("you are can not change your quantity ")
    await Order.findByIdAndUpdate(req.params.orderId, { $set: { quantity } }, { new: true })
    res.json(order)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
router.delete("/delete/:orderId", checkTokenUser, validateId("orderId"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).send("order is not found")

    await Order.findByIdAndRemove(req.params.orderId)
    res.send("order removed")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

//-----------------------------------------feedBack------------------//
router.get("/feedback", checkAdmin, async (req, res) => {
  const feedback = await FeedBack.find().populate("orderId")
  res.json(feedback)
})

router.post(
  "/:orderId/add-feedback",
  checkTokenUser,
  validateId("orderId"),
  validteBody(feedbackJoi),
  async (req, res) => {
    try {
      const { feedback } = req.body
      const order = await Order.findById(req.params.orderId)
      if (!order) return res.status(404).send("order is not  found")
      if (order.userId != req.userId) return res.status(403).send("you are not order maker")
      const FeedBody = new FeedBack({
        feedback,
        orderId: req.params.orderId,
      })
      await FeedBody.save()

      res.json(FeedBody)
    } catch (error) {
      console.log(error.message)
      res.status(500).send(error.message)
    }
  }
)
//____________cart_______________//
router.post("/cart", checkTokenUser, validteBody(orderCartJoi), async (req, res) => {
  try {
    const { orders, location } = req.body
    const newOrdersPromise = orders.map(async order => {
      const product = await Product.findById(order.productId)
      if (!product) return res.status(404).send("product is not  found")
      if (product.quantity < order.quantity) return res.status(400).send("Quantitiy not available")
      const orderNew = new Order({
        productId: order.productId,
        userId: req.userId,
        quantity: order.quantity,
        sellerId: product.userSeller,
        location,
      })
      await User.findByIdAndUpdate(req.userId, { $push: { order: orderNew._id }, new: true })
      await UserSeller.findByIdAndUpdate(product.userSeller, { $push: { order: orderNew._id }, new: true })
      return orderNew.save()
    })
    await Promise.all(newOrdersPromise)

    res.json("oreder created")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

module.exports = router
