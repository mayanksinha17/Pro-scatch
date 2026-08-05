const express = require("express");
const router = express.Router();
const ownersController = require("../controllers/ownersController");
const { isOwnerLoggedIn } = require("../middlewares/auth");

// Seed route - only usable when NODE_ENV=development, and only if no owner exists yet
if (process.env.NODE_ENV === "development") {
    router.post("/create", ownersController.createOwner);
}

router.post("/login", ownersController.loginOwner);
router.get("/logout", ownersController.logoutOwner);

router.get("/me", isOwnerLoggedIn, ownersController.getMe);
router.get("/stats", isOwnerLoggedIn, ownersController.getStats);
router.get("/orders", isOwnerLoggedIn, ownersController.getAllOrders);

router.get("/", function (req, res) {
    res.json({ message: "Owner route working" });
});

module.exports = router;
