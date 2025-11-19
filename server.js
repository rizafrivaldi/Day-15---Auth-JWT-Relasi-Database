require("dotenv").config();

console.log("DEBUG JWT_SECRET =", process.env.JWT_SECRET);
console.log("DEBUG JWT_REFRESH_SECRET =", process.env.JWT_REFRESH_SECRET);

const express = require("express");
const app = express();

app.use(express.json());

const adminRoutes = require("./routes/adminRoutes");
app.use("/admin", adminRoutes);

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

console.log("DEBUG Load userRoutes =", userRoutes);

app.use((err, req, res, next) => {
  console.error("Error caught by handler:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Terjadi kesalahan server",
    stack: err.stack, //tambahkan sementara untuk debugging
  });
});

//Jalankan server//
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
