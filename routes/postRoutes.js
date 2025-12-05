//Import Library & Setup Router//
const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const protect = require("../middleware/authMiddleware");
const authorizesRoles = require("../middleware/roleMiddleware");

//CREATE POST//
router.post("/", protect, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content)
      return res.status(400).json({ message: "Title dan content harus diisi" });

    const post = await prisma.post.create({
      data: {
        title,
        content,
        userId: req.user.id,
      },
    });

    return res.status(201).json({ message: "Post created", post });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//GET ALL POSTS//
router.get("/all", protect, authorizesRoles("admin"), async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//GET POST BY ID//
router.get("/:id", protect, authorizesRoles("admin"), async (req, res) => {
  try {
    const postId = Number(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!post) return res.status(404).json({ message: "Post tidak ditemukan" });
    return res.json({ success: true, post });
  } catch (error) {
    console.error("GET POST DETAIL ERROR:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//UPDATE POST//
router.put("/:id", protect, authorizesRoles("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title dan content harus diisi" });
    }

    const post = await prisma.post.findUnique({
      where: { id: Number(id) },
    });

    if (!post) return res.status(404).json({ message: "Post tidak ditemukan" });

    const updatedPost = await prisma.post.update({
      where: { id: Number(id) },
      data: { title: title || post.title, content: content || post.content },
    });

    return res.json({
      success: true,
      message: "Post diperbarui",
      post: updatedPost,
    });
  } catch (error) {
    console.error("UPDATE POST ERROR:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//DELETE POST//
router.delete("/:id", protect, authorizesRoles("admin"), async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return res.status(404).json({ message: "Post tidak ditemukan" });

    const deleted = await prisma.post.delete({
      where: { id: postId },
    });

    return res.json({ message: "Post dihapus", deletedPost: deleted });
  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//Export Router//
module.exports = router;
