//Import Library & Setup Router//
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const prisma = require("../prisma/prisma");

const protect = require("../middleware/authMiddleware");
const authorizesRoles = require("../middleware/roleMiddleware");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

//Endpoint Register//
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Semua field harus diisi" });
    }

    //Cek Jika Email Sudah Digunakan//
    const userExist = await prisma.user.findUnique({
      where: { email: email },
    });

    if (userExist) {
      return res.status(400).json({ message: "Email sudah digunakan!" });
    }

    //Hash Password//
    const hashedPassword = await bcrypt.hash(password, 10);

    //Simpan User Baru Ke Array//
    const newUser = await prisma.user.create({
      data: {
        username: username,
        email: email,
        password: hashedPassword,
        role: "user",
      },
      select: {id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true},
    });

    return res.status(201).json({ message: "Register berhasil", user: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//Endpoint Login User//
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) 
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi!", });
    

    //Cek Email User Ada Di "Database" Sementara//
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) 
      return res.status(404).json({ message: "User tidak ditemukan!" });

    //Cocokan Password Hashed VS Password Input//
    const match = await bcrypt.compare(password, user.password);
    if (!match) 
      return res.status(400).json({ message: "Password salah!" });
    

    //Buat Access Token & Refresh Token//
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //Simpan Refresh Token Ke Database//
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      },
    });

    //Response Berhasil Login//
    return res.status(200).json({
      message: "Login berhasil",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//Endpoint Refresh Token//
router.post("/refresh", async (req, res) => {
  try {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token tidak ditemukan" });

  //Cari Refresh Token Di Database Dan Pastikan Belum Direvoke//
  const tokenRow = await prisma.refreshToken.findUnique({ where: { token: refreshToken },
  });

  if (!tokenRow || tokenRow.revoked) 
    return res.status(403).json({ message: "Refresh token tidak valid" });

  //Verifikasi Refresh Token Dengan JWT//
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Refresh token kedaluwarsa" });

    //Decoded Hanya Berisi id (Sesuai Payload Saat Membuat Refresh Token) - Cari User Berdasarkan decoded.id//
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) 
      return res.status(404).json({ message: "User tidak ditemukan" });

    //Buat Access Token Baru//
    const newAccessToken = generateAccessToken(user);

    return res.json({
      message: "Access token baru berhasil dibuat",
      accessToken: newAccessToken,
    });
  });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//Endpoint Logout//
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) 
    return res
      .status(400)
      .json({ success: false, message: "Refresh token tidak ditemukan" });

  const tokenRow = await prisma.refreshToken.findUnique({
    where: { token: refreshToken},
  });

  if (!tokenRow) 
    return res.status(403).json({
      message: "Refresh token tidak valid",
    });
  
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    });
    
  //Response Berhasil Logout//
  return res.json({
    success: true,
    message: "Logout berhasil, token dihapus dari daftar aktif",
  });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Terjadi kesalahan server" });
}
});

//Test Protected Route//
router.get("/profile", protect, async (req, res) => {
  try {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true,},
  });

  return res.json({
    message: "Berhasil mengakses route yang dilindungi",
    user
  });
} catch (error) {
  console.error(error);
  res.status(500).json({ message: "Terjadi kesalahan server" });
}
});

//Export Router//
module.exports = router;
