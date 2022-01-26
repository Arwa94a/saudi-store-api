const jwt=require("jsonwebtoken")
const {UserSeller}=require("../models/UserSeller")
const checkSeller=async(req,res,next)=>{

const token=req.header("Authorization")
if(!token) return res.status(401).send("token is missing")

const decryptedToken=jwt.verify(token,process.env.JWT_KEY)
const userId=decryptedToken.id//هذا موجود في sign

const user=await UserSeller.findById(userId)
if(!user) return res.status(404).send("user not found")

req.userId=userId
next()

}

module.exports=checkSeller