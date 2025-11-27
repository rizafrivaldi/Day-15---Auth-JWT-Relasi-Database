require("dotenv").config();
const express = require("express");

const app = express();

//Middleware//
app.use(express.json());

//Routes//
const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

//Error Handling Middleware//
app.use((err, req, res, next) => {
  console.error("Error caught by handler:", err.message);

  res.status(500).json({
    success: false,
    message: err.message || "Terjadi kesalahan server",
  });
});

//Jalankan server//
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
