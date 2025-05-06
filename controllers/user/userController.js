const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcryptjs")

const loadSignup = async (req, res) => {
    try {
        return res.render("signup");

    } catch (error) {
        res.redirect("/pageNotFound");
    }

}


const pageNotFound = async (req, res) => {
    try {
        res.render("page-404");

    } catch (error) {
        console.log("Home page not loading", error);
        res.status(500).send("Server error");
    }

}


const loadHomepage = async (req, res) => {
    try {
        return res.render("home")

    } catch (error) {
        console.log("Home page not found");
        res.status(500).send("Server error");
    }
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, otp) {
    try {
        if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
            throw new Error("Nodemailer credentials not found in environment variables.");
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        // transporter.verify((error, success) => {
        //     if (error) {
        //         console.error("Transporter error:", error);
        //     } else {
        //         console.log("Transporter is ready to send emails");
        //     }
        // });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}`,
            html: `<b>Your OTP: ${otp}</b>`
        });

        // console.log("Email sent:", info.response); // Added for debugging
        return info.accepted.length > 0;

    } catch (error) {
        console.error("Error sending verification email:", error.message);
        return false;
    }
}

const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cPassword } = req.body;

        if (password !== cPassword) {
            return res.render("signup", { message: "Passwords do not match" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render("signup", { message: "User with this email already exists" });
        }

        const otp = generateOTP();
        console.log("Generated OTP:", otp); // << Moved up for visibility

        const emailSent = await sendVerificationEmail(email, otp);
        if (!emailSent) {
            return res.status(500).json({ error: "Failed to send OTP email. Please try again later." });
        }

        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };

        res.render("verify-otp");

    } catch (error) {
        console.error("Signup error:", error.message);
        res.redirect("/pageNotFound");
    }
};

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Failed to secure password');
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log(otp);
        
        if (otp == req.session.userOtp) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);
            
            const saveUserData = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash,
            });

            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({ success: true, redirectUrl: "/" });
        } else {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
    } catch (error) {
        console.error("Error in OTP verification:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" });
        }

        const otp = generateOTP();  
        req.session.userOtp = otp;  

        const emailSent = await sendVerificationEmail(email, otp);
        
        if (emailSent) {
            console.log("Resent OTP:", otp);
            res.status(200).json({ success: true, message: "OTP Resent Successfully" });
        } else {
            res.status(500).json({ success: false, message: "Failed to resend OTP. Please try again" });
        }
    } catch (error) {
        console.error("Error in resend OTP:", error);
        res.status(500).json({success: false, message: "Internal server error" });
    }
};




module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp
}