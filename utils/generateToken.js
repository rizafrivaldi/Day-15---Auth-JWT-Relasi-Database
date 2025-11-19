const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" } //durasi refresh token//
  );
}
module.exports = { generateAccessToken, generateRefreshToken };
