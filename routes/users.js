const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/protect");

const {
  signUp,
  signIn,
  userInfo,
  removeUser,
  updateUserInfo,
  changePassword,
  forgotPassword,
} = require("../controller/users");

router.route("/signup").post(signUp);
router.route("/signin").post(signIn);
router.route("/update").put(protect, updateUserInfo);
router
  .route("/info")
  .get(protect, authorize("admin"), userInfo);
  router
  .route("/change-password")
  .put(protect,changePassword);
  router.route("/forgot-password").put(forgotPassword)
router
  .route("/:id")
  .delete(protect, authorize("admin"), removeUser);
module.exports = router;
