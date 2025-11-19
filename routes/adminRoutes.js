const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleCheck");

router.get("dashboard", protect, roleCheck("admin"), (req, res) => {
  res.json({ message: "Welcome to the admin dashboard" });
});

module.exports = router;
