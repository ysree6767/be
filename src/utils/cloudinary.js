const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const uploadOnCloudinary = async (localFilePath) => {
 try{
  if(!localFilePath)  return null
  //upload file on cloudinary
  cloudinary.uploader.upload(localFilePath, {
   resource_type: 'auto'
  })
  console.log('file is updloaded successfully', response.url)
 
  return response;
  
 }catch(error){
  fs.unlinkSync(localFilePath) //remove the locally saved temp file as upload operation got failed
  return null;
 }
}

cloudinary.config({
 cloud_name: process.env.CLOUDINARY_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret: process.env.CLOUDINARY_API_SECRET
});


cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
 { public_id: "olympic_flag" },
 function (error, result) { console.log(result); });

module.exports = cloudinary;
