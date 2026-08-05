const express = require("express");
const router = express.Router();
const ProductModel = require("../models/product-model");
const { isUsherLoggedIn, isOwnerLoggedIn } = require("../middlewares/auth");

// ---------- Home ----------
router.get("/", async function (req, res, next) {
    try {
        const products = await ProductModel.find().sort({ createdAt: -1 }).limit(8);
        res.render("index", { products, activePage: "home" });
    } catch (err) {
        next(err);
    }
});

// ---------- Auth pages ----------
router.get("/login", function (req, res) {
    if (res.locals.loggedInUser) return res.redirect("/");
    res.render("auth/login", { activePage: "login" });
});

router.get("/register", function (req, res) {
    if (res.locals.loggedInUser) return res.redirect("/");
    res.render("auth/register", { activePage: "register" });
});

// Universal logout (works for both owner and usher tokens - it's the same cookie)
router.get("/logout", function (req, res) {
    res.clearCookie("token");
    res.redirect("/login");
});

// ---------- Shop ----------
router.get("/shop", async function (req, res, next) {
    try {
        const products = await ProductModel.find();
        res.render("shop/shop", { products, activePage: "shop" });
    } catch (err) {
        next(err);
    }
});

router.get("/product/:id", async function (req, res, next) {
    try {
        const product = await ProductModel.findById(req.params.id);
        if (!product) {
            return res.status(404).render("errors/404");
        }
        const related = await ProductModel.find({ _id: { $ne: product._id } }).limit(4);
        res.render("shop/product", { product, related, activePage: "shop" });
    } catch (err) {
        next(err);
    }
});

// ---------- Cart / Checkout (client renders from localStorage cart) ----------
router.get("/cart", function (req, res) {
    res.render("shop/cart", { activePage: "cart" });
});

router.get("/checkout", function (req, res) {
    if (!res.locals.loggedInUser || res.locals.loggedInUser.role !== "usher") {
        return res.redirect("/login?redirect=/checkout");
    }
    res.render("shop/checkout", { activePage: "checkout" });
});

// ---------- Profile ----------
router.get("/profile", function (req, res) {
    if (!res.locals.loggedInUser) {
        return res.redirect("/login?redirect=/profile");
    }
    res.render("user/profile", { activePage: "profile" });
});

// ---------- Admin dashboard (owner only) ----------
router.get("/admin", function (req, res) {
    if (!res.locals.loggedInUser || res.locals.loggedInUser.role !== "owner") {
        return res.redirect("/login?redirect=/admin");
    }
    res.render("admin/dashboard", { activePage: "admin" });
});

module.exports = router;
