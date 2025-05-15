const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const env = require("dotenv").config();
const session = require("express-session");
const { text } = require("body-parser");


function generateOtp() {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;     
}

const sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your email",
      text: `Your OTP is ${otp}`,
      html: `<p>Your OTP is <strong>${otp}</strong></p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
        
  } catch (error) {
    console.error("Error sending email:", error);
    return false;   
    
  }
}

const securePassword = async (password) => {
  try {
      const passwordHash = await bcrypt.hash(password, 10);
      return passwordHash;
  } catch (error) {
      console.error("Error hashing password:", error);
      throw error;
  }
}



const userProfile = async (req, res) => {
    try {
      const userID = req.session.user;
      const userData = await User.findById(userID);
      res.render('profile', {
        user: userData,
      });
    } catch (error) {
      console.error("Error for retrieve profile data", error);
      res.redirect("/pageNotFound");
    }
  }

  const getForgotPassPage = async (req, res) => { 
    try {
        res.render("forgot-password");
    } catch (error) {
        console.error("Error for retrieve profile data", error);
        res.redirect("/pageNotFound");
    }
  }

  const forgotEmailValid = async (req, res) => {
    try {
      const { email } = req.body;
      const findUser = await User.findOne({ email: email });
      if(findUser){
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);
        if (emailSent) {
          req.session.userOtp = otp;
          req.session.email = email;
          res.render("forgotPass-otp");
          console.log("OTP: ", otp);

        } else {
          res.join({ success: false, message: "Error sending email" });
        }
      } else {
        res.render("forgot-password", { message: "Email not registered" });
      }

    } catch (error) {
        console.error("Error for retrieve profile data", error);
        res.redirect("/pageNotFound");
    }
  }


  const verifyForgotPassOtp = async (req, res) => {
    try {
      const enteredOtp = req.body.otp;
      if (enteredOtp === req.session.userOtp) {
        res.json({ success: true, redirectUrl: "/reset-password" });
      } else {
        res.json({ success: false, message: "Invalid OTP" });
      }
    } catch (error) {
      console.error("Error for retrieve profile data", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }      
  }


  const getResetPassPage = async (req, res) => {
    try {
      res.render("reset-password");
    } catch (error) {
      console.error("Error for retrieve profile data", error);
      res.redirect("/pageNotFound");
    }
  }

  
  const resendOtp = async (req, res) => {
    try {
      const otp = generateOtp();
      req.session.userOtp = otp;
      const email = req.session.email;
      console.log("resend otp to email: ", email);

      const emailSent = await sendVerificationEmail(email, otp);

      if (emailSent) {
        console.log("Resend OTP: ", otp);
        res.status(200).json({ success: true, message: "OTP resent successfully" });
      } 
    } catch (error) {
      console.error("Error for retrieve profile data", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  const postNewPassword = async (req, res) => {
    try {
      const { newPass1, newPass2 } = req.body;
      const email = req.session.email;
      if (newPass1 === newPass2) {
        const passwordHash = await securePassword(newPass1);
        await User.updateOne(
          { email: email }, 
          { $set: { password: passwordHash } }
        );
        res.redirect("/login");
      } else {
        res.render("reset-password", { message: "Passwords do not match" });
      }
    } catch (error) {
      console.error("Error for retrieve profile data", error);
      res.redirect("/pageNotFound");
    }
  }






  module.exports = {
    userProfile,
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword
    
  }


