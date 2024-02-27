import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

// Configure cloudinary
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) {
        throw new Error('No file received')
        }
        // Upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })

        //file uploaded successfully
        console.log(response.url);
        return response;

    } catch(error) {
        fs.unlinkSync(localFilePath) // Delete the locally saved temp. file if it was not uploaded to cloudinary
        return null;
    }
        
}


export { uploadToCloudinary }
