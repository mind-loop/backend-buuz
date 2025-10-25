const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");
const { getOrderBasket, createOrder, statusChangeOrder, getStatus, getOrders, getOrder, removeOrderItem } = require("../controller/order");
router.route("/basket").get(protect, getOrderBasket);
router.route("/").post(protect, createOrder).get(protect,getOrders);
router.route("/change-status").put(protect, statusChangeOrder);
router.route("/status").post(protect, getStatus);
router.route("/:id").get(protect, getOrder).delete(protect, removeOrderItem)
module.exports = router;
