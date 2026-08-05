const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productsController");
const { isOwnerLoggedIn } = require("../middlewares/auth");

router.get("/", productsController.getAllProducts);
router.get("/:id", productsController.getProductById);

router.post("/create", isOwnerLoggedIn, productsController.createProduct);
router.put("/:id", isOwnerLoggedIn, productsController.updateProduct);
router.delete("/:id", isOwnerLoggedIn, productsController.deleteProduct);

module.exports = router;
