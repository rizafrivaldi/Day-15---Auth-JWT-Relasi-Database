function roleCheck(requiredRole) {
  return (req, res, next) => {
    if (req.user.role !== requiredRole) {
      return res
        .status(403)
        .json({ message: "Akses ditolak, role tidak sesuai" });
    }
    next();
  };
}

module.exports = roleCheck;
