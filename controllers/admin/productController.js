const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");


// Add this near the top of productController.js
const handleError = (res, error, redirectPath = "/pageerror") => {
  console.error(error);
  res.redirect(redirectPath);
};


const getProductAddPage = async (req, res) => {
    try {
        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        res.render("product-add", {
            cat: category,
            brand: brand
        });
    } catch (error) {
        res.redirect("/pageerror");
    }
};






const addProducts = async (req, res) => {
    try {
        const products = req.body;
        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (!productExists) {
            const images = [];

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;

                    const resizedImagePath = path.join('public', 'uploads', 'product-images', req.files[i].filename);

                    // Crop the image from the center and resize it to 440x440
                    await sharp(originalImagePath)
                        .resize({width: 440, height:440 })
                        .toFile(resizedImagePath);

                    images.push(req.files[i].filename);
                }
            }

            const categoryId = await Category.findOne({ name: products.category });

            if (!categoryId) {
                return res.status(400).json("Invalid category name");
            }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId._id,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdAt: new Date(),
                quantity: products.quantity,
                size: products.size,
                color: products.color,
                productImage: images,
                status: 'Available',
            });

            await newProduct.save();
            return res.redirect("/admin/addProducts");

        } else {
            return res.status(400).json('Product already exists, please try another name');
        }

    } catch (error) {
        console.error("Error saving product", error);
        return res.redirect("/admin/pageerror");
    }
};




const getAllProducts = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = req.query.page || 1;
        const limit = 4;

        const productData = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate("category")
            .exec();

        const count = await Product.find({
            $or: [
                { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
                { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
            ],
        }).countDocuments();

        const category = await Category.find({ isListed: true });
        const brand = await Brand.find({ isBlocked: false });
        if (category && brand) {
            res.render("products", {
                data: productData,
                currentPage: page,
                totalPages: Math.ceil(count / limit),
                cat: category,
                brand: brand,
            });
        } else {
            res.render("page-404");
        }
    } catch {
        res.redirect("/pagerror")
    }
}

const blockProduct = async (req, res) => {
    try {
      let id = req.query.id;
      await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
      res.redirect("/admin/products");
    } catch (error) {
      res.redirect("/pageerror");
    }
  }

  const unblockProduct = async (req, res) => {
    try {
      let id = req.query.id;
      await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
      res.redirect("/admin/products");
    } catch (error) {
      res.redirect("/pageerror");
    }
  }  

const getEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({ _id: id }).lean();
        const category = await Category.find({});
        const brand = await Brand.find({});

        if (product) {
            res.render("edit-product", {
                product: product,
                cat: category,
                brand: brand
            });
        } else {
            res.redirect("/pageerror");
        }
    } catch (error) {
        console.error("Error fetching product for edit:", error);
        res.redirect("/pageerror");
    }
}  


const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        
        // Validate prices
        if (parseFloat(data.salePrice) > parseFloat(data.regularPrice)) {
            return res.status(400).json('Sale price must be less than regular price');
        }

        const existingProduct = await Product.findOne({ 
            productName: data.productName,
            _id: { $ne: id }
        });
        
        if (existingProduct) {
            return res.status(400).json('Product already exists');
        }

        // Process images
        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const resizedImagePath = path.join('public', 'uploads', 'product-images', file.filename);
                
                // Resize and save image using sharp
                await sharp(file.path)
                    .resize({ width: 440, height: 440 })
                    .toFile(resizedImagePath);
                
                images.push(file.filename);
            }
        }

        const updateFields = {
            productName: data.productName,
            description: data.description,
            brand: data.brand,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color,
            updatedAt: new Date()
        };

        if (images.length > 0) {
            updateFields.$push = { productImage: { $each: images } };
        }

        await Product.findByIdAndUpdate(id, updateFields);
        res.redirect("/admin/products");
    } catch (error) {
        handleError(res, error);
    }   
}




const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;
        
        // Remove image from database
        await Product.findByIdAndUpdate(
            productIdToServer,
            { $pull: { productImage: imageNameToServer } }
        );

        // Delete physical file
        const imagePath = path.join(
            __dirname, 
            "..", 
            "..", 
            "public", 
            "uploads", 
            "product-images", 
            imageNameToServer
        );

        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.json({status: true, message: "Image deleted successfully"});
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({status: false, message: "Error deleting image"});
    }
}



module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage
};
