import  express from "express";
const router = express.Router();
import { protect, authorize } from "../middleware/protect.js"

import  {
  signUp,
  signIn,
  userInfo,
  removeUser,
  updateUserInfo,
  changePassword,
  forgotPassword,
} from "../controller/users.js";

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
export default router;
