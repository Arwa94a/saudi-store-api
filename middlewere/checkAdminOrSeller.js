const jwt = require("jsonwebtoken")
const { User } = require("../models/User")
const { UserSeller } = require("../models/UserSeller")

const checkAdminOrSeller = async (req, res, next) => {
  const token = req.header("Authorization")
  if (!token) return res.status(401).send("token is missing")

  const decryptedToken = jwt.verify(token, process.env.JWT_KEY)
  const userId = decryptedToken.id

  const adminFound = await User.findById(userId)
const userSeller=await UserSeller.findById(userId)


if (adminFound.role !== "Admin" && !userSeller ) return res.status(403).send("you are not Admin Or Seller")
  req.userId = userId

  next()
}

module.exports = checkAdminOrSeller
