const bcrypt = require("bcrypt");
const UsherModel = require("../models/ushermodel");
const generateToken = require("../utils/generateToken");

// POST /ushers/register
module.exports.registerUsher = async function (req, res) {
    try {
        const { email, password, fullname } = req.body;
        if (!email || !password || !fullname) {
            return res.status(400).json({ message: "fullname, email and password are required" });
        }

        const existing = await UsherModel.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const usher = await UsherModel.create({ email, password: hash, fullname });

        const token = generateToken({ id: usher._id, email: usher.email, fullname: usher.fullname, role: "usher" });
        res.cookie("token", token, { httpOnly: true, sameSite: "strict" });

        return res.status(201).json({ message: "Usher created successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /ushers/login
module.exports.loginUsher = async function (req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "email and password are required" });
        }

        const usher = await UsherModel.findOne({ email: email.toLowerCase() });
        if (!usher) {
            return res.status(401).json({ message: "Email or password incorrect" });
        }

        const isMatch = await bcrypt.compare(password, usher.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Email or password incorrect" });
        }

        const token = generateToken({ id: usher._id, email: usher.email, fullname: usher.fullname, role: "usher" });
        res.cookie("token", token, { httpOnly: true, sameSite: "strict" });

        return res.status(200).json({ message: "Logged in successfully" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /ushers/logout
module.exports.logoutUsher = function (req, res) {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logged out successfully" });
};

// GET /ushers/me  (protected — used by profile page)
module.exports.getMe = async function (req, res) {
    try {
        const usher = req.usher.toObject();
        delete usher.password;
        return res.status(200).json({ usher });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// PUT /ushers/profile  (protected — edit profile)
module.exports.updateProfile = async function (req, res) {
    try {
        const { fullname, contact, picture } = req.body;
        const updated = await UsherModel.findByIdAndUpdate(
            req.usher._id,
            { $set: { fullname, contact, picture } },
            { new: true, runValidators: true }
        );
        const safe = updated.toObject();
        delete safe.password;
        return res.status(200).json({ message: "Profile updated", usher: safe });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// PUT /ushers/cart  (protected — persists the client-side cart onto the user's
// existing `cart` field, so it survives across devices/sessions)
module.exports.syncCart = async function (req, res) {
    try {
        const { cart } = req.body;
        if (!Array.isArray(cart)) {
            return res.status(400).json({ message: "cart must be an array" });
        }
        const updated = await UsherModel.findByIdAndUpdate(
            req.usher._id,
            { $set: { cart } },
            { new: true }
        );
        return res.status(200).json({ message: "Cart synced", cart: updated.cart });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /ushers/orders  (protected — places an order from the current cart,
// pushes it onto the existing `orders` field, then clears `cart`)
module.exports.placeOrder = async function (req, res) {
    try {
        const { items, shippingAddress, paymentMethod, subtotal, shipping, tax, total, coupon } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Cannot place an order with an empty cart" });
        }
        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({ message: "shippingAddress and paymentMethod are required" });
        }

        const order = {
            items,
            shippingAddress,
            paymentMethod,
            subtotal,
            shipping,
            tax,
            total,
            coupon: coupon || null,
            status: "pending",
            placedAt: new Date(),
        };

        const updated = await UsherModel.findByIdAndUpdate(
            req.usher._id,
            { $push: { orders: order }, $set: { cart: [] } },
            { new: true }
        );

        const newOrder = updated.orders[updated.orders.length - 1];

        return res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
