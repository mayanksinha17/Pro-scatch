const ProductModel = require("../models/product-model");
const OwnerModel = require("../models/owners-models");

// POST /products/create  (owner only)
module.exports.createProduct = async function (req, res) {
    try {
        const { image, name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: "name and price are required" });
        }

        const product = await ProductModel.create({
            image,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
            owner: req.owner._id,
        });

        await OwnerModel.findByIdAndUpdate(req.owner._id, {
            $push: { products: product._id },
        });

        return res.status(201).json({ message: "Product created successfully", product });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /products
module.exports.getAllProducts = async function (req, res) {
    try {
        const products = await ProductModel.find();
        return res.status(200).json({ products });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /products/:id
module.exports.getProductById = async function (req, res) {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        return res.status(200).json({ product });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// PUT /products/:id  (owner only)
module.exports.updateProduct = async function (req, res) {
    try {
        const product = await ProductModel.findOneAndUpdate(
            { _id: req.params.id, owner: req.owner._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) {
            return res.status(404).json({ message: "Product not found or you don't own it" });
        }
        return res.status(200).json({ message: "Product updated", product });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE /products/:id  (owner only)
module.exports.deleteProduct = async function (req, res) {
    try {
        const product = await ProductModel.findOneAndDelete({
            _id: req.params.id,
            owner: req.owner._id,
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found or you don't own it" });
        }
        await OwnerModel.findByIdAndUpdate(req.owner._id, {
            $pull: { products: product._id },
        });
        return res.status(200).json({ message: "Product deleted" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
