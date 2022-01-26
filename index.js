const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const Joi = require("joi")
const JoiObjectId = require("joi-objectid")
Joi.objectId = JoiObjectId(Joi)
require("dotenv").config()
const users = require("./routers/users")
const usersSellers = require("./routers/usersSellers")
const product = require("./routers/products")
mongoose
  .connect(`mongodb://localhost:27017/saudiHandMade `)
  .then(() => console.log("Connected to MongoDB"))
  .catch(error => console.log("Erroe connecting to MongoDB", error))

const app = express()
app.use(express.json())
app.use(cors())

app.use("/api/auth", users)
app.use("/api/auth/seller", usersSellers)
app.use("/api/product", product)

app.listen(7000, () => console.log("Server is listening " + 7000))
