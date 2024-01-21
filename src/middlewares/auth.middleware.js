const jwt = require('jsonwebtoken');
const ApiError = require("../utils/apiErrors")
const asyncHandler = require("../utils/asyncHandler")
const User = require("../models/user.model")

const verifyJWT = asyncHandler(async (req, res, next) => {

 try {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
  if (!token) {
   throw new ApiError(401, "unauthorized request")
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

  if (!user) {
   throw new ApiResponse(401, "Invalid Access Token")
  }

  req.user = user
  next()
 }
 catch (err) {
  throw new ApiError(401, err?.message || "Invalid access token")
 }
})

module.exports = verifyJWT