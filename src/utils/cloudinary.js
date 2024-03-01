import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

// Configure cloudinary
cloudinary.config({ 
  cloud_name: process.env.COULDINARY_CLOUD_NAME, 
  api_key: process.env.COULDINARY_API_KEY,
  api_secret: process.env.COULDINARY_API_SECRET
});

const uploadToCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) {
            return null;
        }
        // Upload file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" })

        //file uploaded successfully
        fs.unlinkSync(localFilePath) // Delete the locally saved temp. file
        return response;

    } catch(error) {
        fs.unlinkSync(localFilePath) // Delete the locally saved temp. file if it was not uploaded to cloudinary
        return null;
    }
        
}


export { uploadToCloudinary }
