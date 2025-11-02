import express from "express";
const router = express.Router();
import  { protect, authorize } from "../middleware/protect.js";
import { createProduct, getProduct, getProducts, updateProduct, deleteProduct, getProductStats } from "../controller/product.js";


router.route("/").post(protect, authorize('admin'), createProduct).get(getProducts);
router.route("/:id").get(getProduct).put(protect, authorize('admin'), updateProduct).delete(protect, authorize('admin'), deleteProduct);
router.route("/stats").get(protect,authorize("admin"), getProductStats);
export default router;
