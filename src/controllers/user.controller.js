const User = require('../models/user.model')
const ApiError = require('../utils/apiErrors')
const asyncHandler = require('../utils/asyncHandler')
const { ApiResponse } = require('../utils/apiResponse')
const { uploadOnCloudinary } = require('../utils/cloudinary')
const { response } = require('express')

const generateAccessAndRefreshTokens = async (userId) => {
 try {
  const user = await User.findById(userId)
  const accessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()

  user.refreshToken = refreshToken
  await user.save({ validateBeforeSave: false })

  return { accessToken, refreshToken }

 } catch (err) {
  throw new ApiError(500, "something went wrong while generating refresh or access token")
 }
}

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

const loginUser = asyncHandler(async (req, res) => {
 // req body -> data
 // username or email
 // find the user
 // password check
 // generate access and refresh token
 // send cookie

 const { email, username, password } = req.body

 if (!username && !email) {
  throw new ApiError(400, "username or email is required")
 }

 const user = await User.findOne({
  $or: [{ username }, { email }]
 })

 if (!user) {
  throw new ApiError(404, 'user does not exist')
 }

 const isPasswordValid = await user.isPasswordCorrect(password)

 if (!isPasswordValid) {
  throw new ApiError(401, "invalid credentials")
 }

 const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
 const loggedInUser = User.findById(user._id).select("-password, -refreshToken")
 const options = { httpOnly: true, secure: true }

 return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
   new ApiResponse(200, {
    user: loggedInUser, accessToken, refreshToken
   }, "user logged-in successfully"
   )
  )
})


const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
   req.user._id, { $set: {
    refreshToken: undefined
   }},
   { new: true }
  )
 const options = { httpOnly: true, secure: true }

 return response.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json( new ApiResponse (200, { }, "User logged out"))

} )




module.exports = { registerUser, loginUser, logoutUser }