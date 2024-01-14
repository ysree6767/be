const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new Schema({
 // define your schema fields here
 username: {
  type: String,
  required: true,
  unique: true
 },
 email: {
  type: String,
  required: true,
  unique: true
 },
 fullName: {
  type: String,
  required: true
 },
 avatar: {
  type: String,
  default: ''
 },
 coverImage: {
  type: String,
  default: ''
 },
 password: {
  type: String,
  required: [true, "Password is required"]
 },
 refreshToken: {
  type: String,
  default: ''
 },
 watchHistory: {
  type: Schema.Types.ObjectId,
  ref: "Video"
 }

}, {
 timestamps: true
});


userSchema.pre('save', async function(next) {
 if(!this.isModified('password')) return next();
   this.password = bcrypt.hash(this.password, 10)
   next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
 return jwt.sign(
  {
   _id: this._id,
   email: this.email,
   username: this.username,
   fullName: this.fullName
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
   expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  }
 )
}
userSchema.methods.generateRefreshToken = function() {
 return jwt.sign(
  {
   _id: this._id,

  },
  process.env.REFRESH_TOKEN_SECRET,
  {
   expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  }
 )
}

const User = mongoose.model('User', userSchema);


module.exports = User