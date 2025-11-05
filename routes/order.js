import express from "express";
const router = express.Router();
import { protect, authorize } from"../middleware/protect.js";
import { getOrderBasket, createOrder, statusChangeOrder, getStatus, getOrders, getOrder, removeOrderItem, getStats, removeOrder } from "../controller/order.js";
router.route("/basket").get(protect, getOrderBasket);
router.route("/").post(protect, createOrder).get(protect,authorize("admin"),getOrders);
router.route("/change-status").put(protect, statusChangeOrder);
router.route("/status").post(protect, getStatus);
router.route("/stats").get(protect,authorize("admin"), getStats);
router.route("/delete/:id").delete(protect, removeOrder)
router.route("/:id").get(protect, getOrder).delete(protect, removeOrderItem)
export default router;
