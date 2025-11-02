import express from "express";
const router = express.Router();
router.route("/").get((req, res) => {
  res.status(200).json({
    message: {
      message: "DEED-BUUZ-API is working fine",
      version: "1.0.3",
      create:"25.10.31"
    },
    success: true,
  });
});
export default router;
