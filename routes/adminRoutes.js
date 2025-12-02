const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const protect = require("../middleware/authMiddleware");
const authorizesRoles = require("../middleware/roleMiddleware");

router.use(protect, authorizesRoles("admin"));

//Get All User
router.get("/users", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("ADMIN GET USERS ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

//Get User by ID
router.get("/users/:id", async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("ADMIN GET USER  ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

//Update User (username, email, role)
router.put("/users/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { username, email, role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { username, email, role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("ADMIN UPDATE USER ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

//Delete User
router.delete("/users/:id", async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("ADMIN DELETE USER ERROR:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
