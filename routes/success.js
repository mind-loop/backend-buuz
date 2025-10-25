const express = require("express");
const router = express.Router();
router.route("/").get((req, res) => {
  res.status(200).json({
    message: {
      message: "DEED-BUUZ-API is working fine",
      version: "1.0.0",
    },
    success: true,
  });
});
module.exports = router;
