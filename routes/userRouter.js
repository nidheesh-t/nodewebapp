const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user/userController");
const profileController = require("../controllers/user/profileController")
const { userAuth } = require("../middlewares/auth");

// Existing routes
router.get("/pageNotFound", userController.pageNotFound);
router.get("/", userController.loadHomepage);
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

// Google Auth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/signup',
        successRedirect: '/'
    })
);

// Login routes
router.get("/login", userController.loadLogin);
router.post("/login", userController.login);

router.get("/logout", userController.logout);

router.get("/userProfile", userAuth, profileController.userProfile)



// New logout route
// router.get("/logout", (req, res) => {
//     req.logout((err) => {
//         if (err) {
//             console.log("Logout error:", err);
//             return res.redirect('/');
//         }
//         req.session.destroy();
//         res.redirect('/login');
//     });
// });

module.exports = router;
