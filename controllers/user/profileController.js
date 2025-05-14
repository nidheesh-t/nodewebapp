const User = require("../../models/userSchema");



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


  module.exports = {
    userProfile
  }