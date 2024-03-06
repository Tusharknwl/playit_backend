import { Router } from "express"; 
import { 
    changeCurrentUserPassword, 
    getCurrentUser, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    refreshToken, 
    registerUser, 
    updateAccountDetails, 
    updateAvatar, 
    updateUserCoverImage 
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {name: "coverImage", maxCount: 1},
        {name: "avatar", maxCount: 1}
        
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verifyToken, logoutUser)
router.route("/refresh-token").post(refreshToken)
router.route("/change-password").post(verifyToken, changeCurrentUserPassword)
router.route("/current-user").get(verifyToken, getCurrentUser)
router.route("/update-account").patch(verifyToken, updateAccountDetails)

router.route("/avatar").patch(verifyToken, upload.single("avatar"), updateAvatar)
router.route("/cover-image").patch(verifyToken, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyToken, getCurrentUser)
router.route("/history").get(verifyToken, getWatchHistory)


export default router;