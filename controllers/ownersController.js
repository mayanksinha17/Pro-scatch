const bcrypt = require("bcrypt");
const OwnerModel = require("../models/owners-models");
const ProductModel = require("../models/product-model");
const UsherModel = require("../models/ushermodel");
const generateToken = require("../utils/generateToken");

// POST /owners/create  (only enabled when NODE_ENV === "development" - see router)
module.exports.createOwner = async function (req, res) {
    try {
        const existingOwnerCount = await OwnerModel.countDocuments();
        if (existingOwnerCount > 0) {
            return res.status(403).json({ message: "An owner already exists. Cannot create another." });
        }

        const { fullname, email, password } = req.body;
        if (!fullname || !email || !password) {
            return res.status(400).json({ message: "fullname, email and password are required" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const owner = await OwnerModel.create({ fullname, email, password: hashedPassword });

        const token = generateToken({ id: owner._id, email: owner.email, fullname: owner.fullname, role: "owner" });
        res.cookie("token", token, { httpOnly: true, sameSite: "strict" });

        const ownerSafe = owner.toObject();
        delete ownerSafe.password;

        return res.status(201).json({ message: "Owner created successfully", owner: ownerSafe });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /owners/login
module.exports.loginOwner = async function (req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required" });
        }

        const owner = await OwnerModel.findOne({ email: email.toLowerCase() });
        if (!owner) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, owner.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken({ id: owner._id, email: owner.email, fullname: owner.fullname, role: "owner" });
        res.cookie("token", token, { httpOnly: true, sameSite: "strict" });

        return res.status(200).json({ message: "Logged in successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /owners/logout
module.exports.logoutOwner = function (req, res) {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully" });
};

// GET /owners/me  (protected — used by profile / admin dashboard)
module.exports.getMe = async function (req, res) {
    try {
        const owner = req.owner.toObject();
        delete owner.password;
        return res.status(200).json({ owner });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /owners/orders  (protected — feeds the admin orders table)
module.exports.getAllOrders = async function (req, res) {
    try {
        const ushers = await UsherModel.find({}, "fullname email orders");
        const orders = [];
        ushers.forEach((u) => {
            u.orders.forEach((o) => {
                orders.push({
                    ...o.toObject(),
                    customerName: u.fullname,
                    customerEmail: u.email,
                });
            });
        });
        orders.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
        return res.status(200).json({ orders });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
module.exports.getStats = async function (req, res) {
    try {
        const [productCount, usherCount, ushers] = await Promise.all([
            ProductModel.countDocuments(),
            UsherModel.countDocuments(),
            UsherModel.find({}, "orders"),
        ]);

        let orderCount = 0;
        let revenue = 0;
        ushers.forEach((u) => {
            orderCount += u.orders.length;
            u.orders.forEach((o) => {
                revenue += o.total || 0;
            });
        });

        return res.status(200).json({
            products: productCount,
            customers: usherCount,
            orders: orderCount,
            revenue,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
