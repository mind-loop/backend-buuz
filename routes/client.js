const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  signUp,
  signIn,
  clientInfo,
  updateClientInfo,
  changePassword,
  removeClient,
  getClients,
  getClient,
  forgotPassword,
} = require("../controller/clients");

// 🔹 Бүх харилцагчдыг авах (админ эрхтэй)
router.route("/").get(protect, authorize("admin"), getClients).put(protect, updateClientInfo);

// 🔹 Бүртгүүлэх / Нэвтрэх
router.post("/signup", signUp);
router.post("/signin", signIn);

// 🔹 Хэрэглэгчийн мэдээлэлтэй ажиллах
router
  .route("/info")
  .get(protect, clientInfo)

// 🔹 Нууц үг солих
router.put("/change-password", protect, changePassword);
router.put("/forgot-password", forgotPassword);

// 🔹 Хэрэглэгч устгах (зөвхөн админ)
router.get("/:id", protect, authorize("admin"), getClient).delete("/:id", protect, authorize("admin"), removeClient);

module.exports = router;
