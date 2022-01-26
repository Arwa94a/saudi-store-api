const express = require("express")
const router = express.Router()
const validteBody = require("../middlewere/validateBody")
const { Product, productJoi, editProductJoi, ratingJoi } = require("../models/Product")
const checkSeller = require("../middlewere/checkSeller")
const checkTokenUser = require("../middlewere/checkTokenUser")
const validateId = require("../middlewere/validateId")
const { commentJoi, Comment } = require("../models/Comment")
const { User } = require("../models/User")
const { UserSeller } = require("../models/UserSeller")
const checkAdmin = require("../middlewere/checkAdmin")
const { Order } = require("../models/Order")

router.get("/", async (req, res) => {
  try {
    const product = await Product.find().populate("userSeller").populate("comments")

    res.json(product)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
router.get("/myProduct", checkSeller, async (req, res) => {
  try {
    const product = await Product.find({ userSeller: req.userId }).populate("comments")

    res.json(product)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.get("/:oneproductId", validateId("oneproductId"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.oneproductId).populate("userSeller")

    if (!product) return res.status(404).send("product is not found")
    res.json(product)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.post("/new-product", checkSeller, validteBody(productJoi), async (req, res) => {
  try {
    const { title, description, image, price, quantity, type } = req.body

    const product = new Product({
      title,
      description,
      image,
      price,
      userSeller: req.userId,
      quantity,
      type,
    })

    await UserSeller.findByIdAndUpdate(product.userSeller, { $push: { products: product._id }, new: true })

    await product.save()

    res.json(product)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.put("/edit-product/:id", checkSeller, validteBody(editProductJoi), async (req, res) => {
  try {
    const { title, description, image, price, quantity } = req.body
    const id = req.params.id
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { title, description, image, price, quantity } },
      { new: true }
    )

    if (!product) return res.status(404).send("product is not found")
    res.json(product)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

router.delete("/delete-product/:id", checkSeller, async (req, res) => {
  try {
    await Comment.deleteMany({ id: req.params.id })
    await Order.deleteMany({ id: req.params.id })

    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).send("product is not found")
    if (product.userSeller != req.userId) return res.status(403).send("unthurazation action")
    await Product.findByIdAndRemove(req.params.id)

    res.send("product is deleted")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
//--------------------------------admin delete products-----------------------//
router.delete("/product-admin-delete/:id", checkAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).send("product is not found")
    await Product.findByIdAndRemove(req.params.id)
    res.send("product is deleted")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
//---------------------------------comment---------------------------//
router.get("/:productId/comments", validateId("productId"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
    if (!product) return res.status(404).send("product is not found")

    const comment = await Comment.find({ productId: req.params.productId })

    res.json(comment)
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
router.post(
  "/:productId/comments",
  checkTokenUser,
  validateId("productId"),
  validteBody(commentJoi),
  async (req, res) => {
    try {
      const { comment } = req.body
      const product = await Product.findById(req.params.productId)
      if (!product) return res.status(404).send("product is not found")

      const commentNew = new Comment({
        comment,
        owner: req.userId,
        productId: req.params.productId,
      })

      await Product.findByIdAndUpdate(req.params.productId, { $push: { comments: commentNew._id } })

      await commentNew.save()
      res.json(commentNew)
    } catch (error) {
      console.log(error.message)
      res.status(500).send(error.message)
    }
  }
)
router.delete(
  "/:productId/comments/:commentId",
  checkTokenUser,
  validateId("productId", "commentId"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId)
      if (!product) return res.status(404).send("product is not found")

      const commentFound = await Comment.findByIdAndUpdate(req.params.commentId)
      if (!commentFound) return res.status(404).send("comment not found")

      const user = await User.findById(req.userId)

      if (user.role !== "Admin" && commentFound.owner != req.userId) return res.status(403).send("unauthorazation ")

      await Product.findByIdAndUpdate(req.params.productId, { $pull: { comments: commentFound._id } })

      await Comment.findByIdAndRemove(req.params.commentId)

      res.send("comment removed")
    } catch (error) {
      console.log(error.message)
      res.status(500).send(error.message)
    }
  }
)

//------------------------------rating--------------------------//
router.post("/:productId/rating", checkTokenUser, validateId("productId"), validteBody(ratingJoi), async (req, res) => {
  try {
    const { rating } = req.body
    let product = await Product.findById(req.params.productId)
    if (!product) return res.status(404).send("product is not found")
    const newRating = {
      rating,
      userId: req.userId,
    }
    const ratingFound = product.ratings.find(ratingObj => ratingObj.userId == req.userId)
    if (ratingFound) return res.status(400).send("user already rated this product")

    product = await Product.findByIdAndUpdate(req.params.productId, { $push: { ratings: newRating } }, { new: true })

    let ratingSum = 0
    product.ratings.forEach(ratingObject => {
      ratingSum += ratingObject.rating
    })
    const ratingAverage = ratingSum / product.ratings.length

    await Product.findByIdAndUpdate(req.params.productId, { $set: { ratingAverage } })

    res.send("rating added")
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})
//-------------------------------------------likes---------------------//
router.get("/:productId/likes", checkTokenUser, validateId("productId"), async (req, res) => {
  try {
    let product = await Product.findById(req.params.productId)
    if (!product) return res.status(404).send("product is not found")

    const userFound = product.likes.find(like => like == req.userId)

    if (userFound) {
      await Product.findByIdAndUpdate(req.params.productId, { $pull: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $pull: { likes: req.params.productId } })
      res.send("remove like")
    } else {
      await Product.findByIdAndUpdate(req.params.productId, { $push: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $push: { likes: req.params.productId } })
      res.send("like add")
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).send(error.message)
  }
})

module.exports = router
