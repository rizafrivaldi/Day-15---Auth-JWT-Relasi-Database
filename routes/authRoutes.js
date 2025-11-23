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

{/*
//"Database" Sementara//
const users = [];
let tokenBlackList = [];
let validRefreshTokens = [];
*/}

//Endpoint Register//
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body; //Ambil Data Dari Body Request//

    //Validasi Input//
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

    //Response Berhasil//
    return res.status(201).json({ message: "Register berhasil", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//Endpoint Login User//
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    //Validasi Input//
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email dan password wajib diisi!" });
    }

    //Cek Email User Ada Di "Database" Sementara//
    const user = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    //Cocokan Password Hashed VS Password Input//
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Password salah!" });
    }

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

    {/*
    //Simpan Refresh Token Di "Database" Sementara//
    validRefreshTokens.push(refreshToken);
    */}

    //Response Berhasil Login//
    return res.status(200).json({
      message: "Login berhasil",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//Endpoint Refresh Token//
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body; //Ambil refresh token dari body request//

  //Cek Apakah Token Ada//
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token tidak ditemukan" });

  //Cari Refresh Token Di Database Dan Pastikan Belum Direvoke//
  const tokenRow = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!tokenRow || tokenRow.revoked) {
    return res.status(403).json({ message: "Refresh token tidak valid" });
  }

  {/*
  //Cek Apakah Refresh Token Ada Di Daftar Token Valid (Whitelist)//
  if (!validRefreshTokens.includes(refreshToken))
    return res.status(403).json({ message: "Refresh token tidak valid" });

  //Cek Apakah Refresh Token Sudah Di-Blacklist//
  if (tokenBlackList.includes(refreshToken))
    return res.status(403).json({ message: "Refresh token sudah diblacklist" });
  */}

  //Verifikasi Refresh Token Dengan JWT//
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err)
      return res.status(403).json({ message: "Refresh token kedaluwarsa" });

    //Decoded Hanya Berisi id (Sesuai Payload Saat Membuat Refresh Token) - Cari User Berdasarkan decoded.id//
    const foundUser = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!foundUser) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    //Buat Access Token Baru//
    const newAccessToken = generateAccessToken(user);

    return res.json({
      message: "Access token baru berhasil dibuat",
      accessToken: newAccessToken,
    });
  });
});

//Endpoint Logout//
router.post("/logout", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "Refresh token tidak ditemukan" });
  }

  {/*
  //Cek Apakah Token Ada Di Daftar Valid Refresh Tokens//
  if (!validRefreshTokens.includes(refreshToken)) {
    return res.status(403).json({
      success: false,
      message: "Refresh token tidak valid",
    });
  }
  
  //Cek Apakah Token Sudah Di Blacklist//
  if (tokenBlackList.includes(refreshToken)) {
    return res
      .status(403)
      .json({ message: "Token sudah logout (diblacklist)" });
  }

  //Tambahkan Token Ke Daftar Blacklist Supaya Tidak Bisa Dipakai Lagi//
  tokenBlackList.push(refreshToken);

  */}

  await prisma.refreshToken.update({
    where: { token: tokenRow},
    data: { revoked: true },
  });

  //Response Berhasil Logout//
  return res.json({
    success: true,
    message: "Logout berhasil, token dihapus dari daftar aktif",
  });
});

//Test Protected Route//
router.get("/profile", protect, (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {id: true, username: true, email: true, role: true, createdAt: true, updatedAt: true},
  });

  res.json({
    message: "Berhasil mengakses route yang dilindungi",
    user
  });
});

//Export Router//
module.exports = router;
