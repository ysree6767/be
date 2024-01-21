const User = require('../models/user.model')
const ApiError = require('../utils/apiErrors')
const asyncHandler = require('../utils/asyncHandler')
const { ApiResponse } = require('../utils/apiResponse')
const { uploadOnCloudinary } = require('../utils/cloudinary')


const registerUser = asyncHandler(async (req, res) => {
 // get user details from frontend
 // validation - not empty
 // check if user already exists: username, email
 // check for images, check for avatar
 // upload them to cloudinary, avatar
 // create user object - create entry in db
 // remove password and refresh token field from response
 // check for user creation

 const { username, email, fullName, password } = req.body
 // console.log('email: ', email)


 if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
  throw new ApiError(400, "All fields are required")
 }

 const existingUser = await User.findOne({
  $or: [{ username }, { email }]
 })

 if (existingUser) {
  throw new ApiError(409, "user with email or username already exists")
 }
// console.log('req.files', req.files)
 const avatarLocalPath = req.files?.avatar[0]?.path
 // console.log('avatarLocalPath', avatarLocalPath)
 const coverImageLocalPath = req.files?.coverImage[0]?.path

 if (!avatarLocalPath) {
  throw new ApiError(400, "avatar is required")
 }

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverImageLocalPath)

 if (!avatar) {
  throw new ApiError(400, "Avatar file is required")
 }

 const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email, password,
  username: username.toLowerCase()
 })

 const createdUser = await User.findById(user._id).select("-password -refreshToken")

 if (!createdUser) {
  throw new ApiError(500, 'something went wrong while registering the user')
 }

 return res.status(201).json(
  new ApiResponse(200, createdUser, 'user registered successfully')
 )
})

module.exports = registerUser