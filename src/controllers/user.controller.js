const User = require('../models/user.model')
const ApiError = require('../utils/apiErrors')
const asyncHandler = require('../utils/asyncHandler')
const ApiResponse = require('../utils/apiResponse')
const { uploadOnCloudinary } = require('../utils/cloudinary')

const jwt = require('jsonwebtoken')

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
  const loggedInUser = await User.findById(user._id).select("-password, -refreshToken")
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


const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, {
    $set: {
      refreshToken: undefined
    }
  },
    { new: true }
  )
  const options = { httpOnly: true, secure: true }

  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))

})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'unauthorized request')
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used")
    }

    const options = { httpOnly: true, secure: true }

    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refresh successfully"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "invalid password")
  }

  user.password = newPassword

  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfuly"))

})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched"))
})

const updateAccontDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body

  if (!(fullName || email)) {
    throw new ApiError(400, "all fields are required")
  }

  const user = User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        fullName, email
      }
    },
    { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details updated succesfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, {
      $set: {
        avatar: avatar.url
      }
    }, {new: trusted}
  ).select("-password")


  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar Uploaded successfully"))
})

const updateUserCoverImg = asyncHandler(async (req, res) => {

  const coverImgLocalPath = req.file?.path

  if (!coverImgLocalPath) {
    throw new ApiError(400, "coverImg file is missing")
  }

  const coverImg = await uploadOnCloudinary(coverImgLocalPath)

  if (!coverImg.url) {
    throw new ApiError(400, "Error while uploading coverImg")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, {
    $set: {
        coverImage: coverImg.url
    }
  }, { new: trusted }
  ).select("-password")


  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage Uploaded successfully"))
})



module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccontDetails, updateUserAvatar, updateUserCoverImg }