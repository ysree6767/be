require('dotenv').config({path: './env'})
const app = require('./app');
// import dotenv from "dotenv"
const connectDB = require ("./db");

// dotenv.config({
//  path: './.env'
// })


connectDB()
.then( () => {
 app.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running at Port: ${process.env.PORT}`)
 } )
} )
 .catch((err) => {
  console.log("MONGO db connection failed !!! ", err);
 })



/*
import express from "express"
const app = express()

(async () => {
 try{
  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
  app.on("errror", (error) => {
   console.log("ERRR: ", error);
   throw error
  })

  app.listen(process.env.PORT, () => {
   console.log(`App is listening on port ${process.env.PORT}`);
  })
 }
 catch(err) {
  console.error('error:', err)
  throw err
 }
} )()
*/