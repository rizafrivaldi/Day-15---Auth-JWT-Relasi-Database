//Import Library & Setup Router//
const express = require("express");
const router = express.Router();
const prisma = require("../prisma/prisma");
const protect = require("../middleware/authMiddleware");

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
router.get("/", async (req, res) => {
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
    });

    return res.json(posts);
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//GET POST BY ID//
router.get("/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post tidak ditemukan" });
    }

    return res.json(post);
  } catch (error) {
    console.error("GET POST ERROR:", error);
    return res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//UPDATE POST//
router.put("/:id", protect, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const { title, content } = req.body;
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return res.status(404).json({ message: "Post tidak ditemukan" });

    if (post.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const updated = await prisma.post.update({
      where: { id: postId },
      data: { title, content },
    });

    return res.json({ message: "Post diperbarui", post: updated });
  } catch (error) {
    console.error("UPDATE POST ERROR:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//DELETE POST//
router.delete("/:id", protect, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return res.status(404).json({ message: "Post tidak ditemukan" });

    if (post.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return res.json({ message: "Post dihapus" });
  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

//Export Router//
module.exports = router;
