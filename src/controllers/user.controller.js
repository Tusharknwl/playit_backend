import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Generate access and refresh tokens with user Id
const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, 'Error generating tokens')
    }

}

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

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

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

const loginUser = asyncHandler(async (req, res) => {
    //get the user data from the req body
    //validate the user data
    //check if the user exists
        //if not exists, redirect to rgister user
    //check if the password is correct
    //generate token
    //send cookie with token

    const {userName, email, password} = req.body

    if(!userName && !email){
        throw new ApiError(400, 'Please provide a username or email')
    }

    const user = await User.findOne({
        $or: [
            {userName: userName.toLowerCase()},
            {email}
        ]
    })

    if(!user){
        throw new ApiError(404, 'User not found')
    }

    const isPasswordValid = await user.verifyPassword(password)

    if(!isPasswordValid){
        throw new ApiError(401, 'Invalid credentials')
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

    const option = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie('accessToken', accessToken, option)
    .cookie('refreshToken', refreshToken, option)
    .json(new ApiResponse(
        200, 
        {
            user: loggedInUser,
            accessToken, 
            refreshToken
        }, 
        'User logged in successfully'
    ))

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {new: true}
    )
    const option = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie('accessToken', option)
    .clearCookie('refreshToken', option)
    .json(new ApiResponse(200, {}, 'User logged out successfully'))
})

const refreshToken = asyncHandler(async (req, res) => {
    const incomingRreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRreshToken){
        throw new ApiError(401, 'Unauthorized')
    }

    try {
        const decodedToken = jwt.verify(
            incomingRreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, 'Invalid refresh token')
        }
    
        if(user.refreshToken !== incomingRreshToken){
            throw new ApiError(401, 'Refresh token is expired')
        }
    
        const option = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res.status(200)
        .cookie('accessToken', accessToken, option)
        .cookie('refreshToken', newRefreshToken, option)
        .json(new ApiResponse(200, {accessToken, newRefreshToken}, 'Token refreshed successfully'))
    } catch (error) {
        throw new ApiError(401, error?.message || 'Unauthorized')
    }
})

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.verifyPassword(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400, 'Invalid credentials')
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200).json(new ApiResponse(200, {}, 'Password changed successfully'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'User profile retrieved successfully'))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, 'Please fill all the fields')
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {new: true}
    ).select('-password -refreshToken')
    return res.status(200).json(new ApiResponse(200, user, 'User profile updated successfully'))

})

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400, 'Please provide an avatar')
    }
    const avatar = await uploadToCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500, 'Error uploading avatar')
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select('-password -refreshToken')

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, 'User avatar updated successfully')
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, 'Please provide an avatar')
    }
    const coverImage = await uploadToCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(500, 'Error uploading coverImage')
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select('-password -refreshToken')

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, 'User cover image updated successfully')
    )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {userName} = req.params

    if(!userName?.trim()){
        throw new ApiError(400, 'Username is missing')
    }

    const channel = await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscriberCount: { $size: "$subscribers" },
                subscribedToCount: { $size: "$subscribedTo" }
            },
            isSubscribed: {
                $cond: {
                    if: {
                        $in: [req.user?._id, "$subscribers.subscriber"]
                    },
                    then: true,
                    else: false
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        
        }
    ])

    if(!channel || channel.length === 0){
        throw new ApiError(404, 'Channel not found')
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], 'Channel profile retrieved successfully'))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0]?.watchHistory, 'Watch history retrieved successfully'))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}
