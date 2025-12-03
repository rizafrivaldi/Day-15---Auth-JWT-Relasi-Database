const jwt = require("jsonwebtoken");
const prisma = require("../prisma/prisma");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  //Pastikan header Authorization ada dan formatnya benar//
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Akses ditolak, token tidak ditemukan" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!req.user) {
      return res.status(401).json({ message: "Pengguna tidak ditemukan" });
    }

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Token tidak valid atau kedaluwarsa" });
  }
}

module.exports = authMiddleware;
