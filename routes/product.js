const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");
const { createProduct, getProduct, getProducts, updateProduct, deleteProduct } = require("../controller/product");


router.route("/").post(protect, authorize('admin'), createProduct).get(getProducts);
router.route("/:id").get(getProduct).put(protect, authorize('admin'), updateProduct).delete(protect, authorize('admin'), deleteProduct);
module.exports = router;
