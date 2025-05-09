const Category = require("../../models/categorySchema");

const categoryInfo = async (req, res) => {
    try {
//        console.log("Fetching categories...");
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        
        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
//        console.log("Categories fetched:", categoryData);
            
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        
//        console.log("Rendering category page...");
        res.render("admin/category", {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.redirect("/admin/pageerror");
    }
};

const addCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category already exists" });
        }
        
        const newCategory = new Category({
            name,
            description,
        });
        
        await newCategory.save();
        return res.json({ message: "Category added successfully" });
    } catch (error) {
        console.error("Error adding category:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getListCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: false } });
        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error while updating category:", error);
        res.redirect("/admin/pageerror");
    }
};

const getUnlistCategory = async (req, res) => {
    try {
        let id = req.query.id;
        await Category.updateOne({ _id: id }, { $set: { isListed: true } });
        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error while unlisting category:", error);
        res.redirect("/admin/pageerror");
    }
};

const getEditCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const category = await Category.findById(id);
        
        if (!category) {
            return res.redirect("/admin/pageerror");
        }
        
        res.render("admin/edit-category", { 
            category: category,
            error: null
        });
    } catch (error) {
        console.error("Error loading edit category:", error);
        res.redirect("/admin/pageerror");
    }
};

const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const { categoryName, description } = req.body;

        // Check if category exists (excluding current category)
        const existingCategory = await Category.findOne({ 
            name: categoryName, 
            _id: { $ne: id } 
        });

        if (existingCategory) {
            const currentCategory = await Category.findById(id);
            return res.render("admin/edit-category", { 
                category: currentCategory,
                error: "Category name already exists" 
            });
        }

        const updateCategory = await Category.findByIdAndUpdate(
            id,
            { name: categoryName, description },
            { new: true }
        );

        if (!updateCategory) {
            return res.redirect("/admin/pageerror");
        }

        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error updating category:", error);
        res.redirect("/admin/pageerror");
    }
};

module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory
};