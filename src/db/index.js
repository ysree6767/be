// import mongoose from "mongoose";
const mongoose = require('mongoose')
const {DB_NAME} = require('../constants')
// import { DB_NAME } from '../constants'

const connectDB = async () => {
 try{
  const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

  console.log(`/n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
 }
 catch (error){
  console.log("mongodb connection error ",error)
  process.exit(1)
 }
}

// export default connectDB
module.exports = connectDB