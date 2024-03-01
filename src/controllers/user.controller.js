import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
    // get the user data from the request body
    // validate the user data not empty
    // check if the user already exists
    // check for img, and avatar
    // upload to cloudinary, avatar
    // create user object -creat entry in db
    // remove password and token from the object
    // check for user creation
    // return the response

    const {fullName, email, userName, password} = req.body
    // console.log(fullName, email, userName, password)

    if(!fullName || !email || !userName || !password){
        throw new ApiError(400, 'Please fill all the fields')
    }

    const existedUser = await User.findOne({
        $or: [
            {email},
            {userName}
        ]
    })

    if(existedUser){
        throw new ApiError(409, 'User already exists')
    }

    // console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // const coverImageLocalPath = req.files?.coverImage[0]?.path || "" 
    if(!avatarLocalPath){
        throw new ApiError(400, 'Please provide an avatar')
    }

    const avatar = await uploadToCloudinary(avatarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(500, 'Error uploading avatar')
    }

    const user = await User.create({
        fullName,
        email,
        userName: userName.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if(!createdUser){
        throw new ApiError(500, 'Something went wrong while registering the user')
    }

    return res.status(201).json(new ApiResponse(201, createdUser, 'User registered successfully'))
    
})

export { registerUser }
