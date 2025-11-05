import express from "express";
const router = express.Router();
router.route("/").get((req, res) => {
  res.status(200).json({
    message: {
      message: "DEED-BUUZ-API is working fine",
      version: "1.0.5",
      create:"25.11.06"
    },
    success: true,
  });
});
export default router;
