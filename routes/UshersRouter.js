const express = require("express");
const router = express.Router();
const ushersController = require("../controllers/ushersController");
const { isUsherLoggedIn } = require("../middlewares/auth");

router.get("/", function (req, res) {
    res.json({ message: "Usher route working" });
});

router.post("/register", ushersController.registerUsher);
router.post("/login", ushersController.loginUsher);
router.get("/logout", ushersController.logoutUsher);

router.get("/me", isUsherLoggedIn, ushersController.getMe);
router.put("/profile", isUsherLoggedIn, ushersController.updateProfile);
router.put("/cart", isUsherLoggedIn, ushersController.syncCart);
router.post("/orders", isUsherLoggedIn, ushersController.placeOrder);

module.exports = router;
