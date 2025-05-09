// const User = require("../../models/userSchema");
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const customerInfo = async (req, res) => {
//     try {
//         let search = "";
//         if (req.query.search) {
//             search = req.query.search;
//         }
        
//         let page = 1;
//         if (req.query.page) {
//             page = req.query.page;
//         }

//         const limit = 3;
//         const userData = await User.find({
//             isAdmin: false,
//             $or: [
//                 { name: { $regex: ".*" + search + ".*" } },
//                 { email: { $regex: ".*" + search + ".*" } },
//             ],
//         })
//         .limit(limit*1)
//         .skip((page-1)*limit)
//         .exec();

//         const count = await User.find({
//             isAdmin: false,
//             $or: [
//                 { name: { $regex: ".*" + search + ".*" } },
//                 { email: { $regex: ".*" + search + ".*" } },
//             ],
//         }).countDocuments();

//         res.render("customers")

//     } catch (error) {}
// };


// module.exports = {
//     customerInfo
// }


const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 3;

        const query = {
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        };

        const userData = await User.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query);
        const totalPages = Math.ceil(count / limit);

        res.render("customers", {
            data: userData,
            currentPage: page,
            totalPages,
        });

    } catch (error) {
        console.error("Error in customerInfo:", error);
        res.render("admin/admin-error", { message: "Failed to load customers." });
    }
};

const customerBlocked = async (req, res) => {
    try {
        const id = req.query.id;
        await User.updateOne(
            { _id: id },  // Changed from 'id' to '_id' for MongoDB
            { $set: { isBlocked: true } }
        );
        res.redirect("/admin/users");
    } catch (error) {
        console.error("Error blocking customer:", error);
        res.redirect("/pageerror");
    }
};

const customerunBlocked = async (req, res) => {
    try {
        const id = req.query.id;
        await User.updateOne(
            { _id: id },  // Changed from 'id' to '_id' for MongoDB
            { $set: { isBlocked: false } }
        );
        res.redirect("/admin/users");
    } catch (error) {
        console.error("Error unblocking customer:", error);
        res.redirect("/pageerror");
    }
};



module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked
};
