const express = require("express");
const router = express.Router();
router.route("/").get((req, res) => {
  res.status(200).json({
    message: {
      message: "DEED-BUUZ-API is working fine",
      version: "1.0.2",
      create:"25.10.31"
    },
    success: true,
  });
});
module.exports = router;
