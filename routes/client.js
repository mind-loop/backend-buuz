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
} = require("../controller/clients");

// 🔹 Бүх харилцагчдыг авах (админ эрхтэй)
router.route("/").get(protect, authorize("admin"), getClients);

// 🔹 Бүртгүүлэх / Нэвтрэх
router.post("/signup", signUp);
router.post("/signin", signIn);

// 🔹 Хэрэглэгчийн мэдээлэлтэй ажиллах
router
  .route("/info")
  .get(protect, clientInfo)
  .put(protect, updateClientInfo);

// 🔹 Нууц үг солих
router.put("/change-password", protect, changePassword);

// 🔹 Хэрэглэгч устгах (зөвхөн админ)
router.delete("/:id", protect, authorize("admin"), removeClient);

module.exports = router;
