require("dotenv").config();
console.log("DEBUG JWT_SECRET =", process.env.JWT_SECRET);
const express = require("express");
const app = express();

app.use(express.json());

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

{
  /*
//server.js//
const express = require("express");
const dotenv = require("dotenv");

//Load environment variables//
dotenv.config();

const app = express();

//Middleware bawaan Express untuk parsing JSON body//
app.use(express.json());

//Import routes//
const authRoutes = require("./routes/authRoute");
app.use("/api/auth", authRoutes);

//Gunakan route//
app.use("/", (req, res) => {
  res.send("Server running with Express JWT Auth");
});


*/
}
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
console.log("DEBUG JWT_SECRET =", process.env.JWT_SECET);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
