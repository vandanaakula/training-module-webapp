const express = require("express");
const Module = require("../models/Module");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Increase JSON payload limit for image uploads
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ limit: '50mb', extended: true }));

const uploadDir = path.resolve(__dirname, "../uploads");
console.log("Upload directory path:", uploadDir);

// Add these modifications to your modules.js route file

// Modify the multer configuration to accept videos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, "../uploads");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created upload directory");
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Update the file filter to accept both images and videos
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size for videos
  fileFilter: function (req, file, cb) {
    // Accept images and videos
    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/")) {
      return cb(new Error("Only image and video files are allowed!"));
    }
    cb(null, true);
  },
});


// Keep your existing image upload route
router.post("/upload-image", authMiddleware, isAdmin, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Return the path to the uploaded file
    const serverUrl = req.protocol + '://' + req.get('host');
    const imageUrl = `${serverUrl}/uploads/${req.file.filename}`;
    console.log("Image uploaded:", imageUrl);
    res.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Error uploading image" + error.message });
  }
});

// Add a new route for video uploads
router.post("/upload-video", authMiddleware, isAdmin, upload.single("video"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Return the path to the uploaded file
    const serverUrl = req.protocol + '://' + req.get('host');
    const videoUrl = `${serverUrl}/uploads/${req.file.filename}`;
    console.log("Video uploaded:", videoUrl);
    res.json({ videoUrl });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Error uploading video: " + error.message });
  }
});

router.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// ✅ Create a New Training Module (Admin Only)
router.post("/create", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, content, slides, quizzes } = req.body;

    // Parse slides and quizzes if sent as a string
    const parsedSlides = slides;
    const parsedQuizzes = quizzes;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    if (!Array.isArray(parsedSlides) || parsedSlides.length === 0) {
      return res.status(400).json({ error: "At least one slide is required" });
    }
    // Create new module
    const newModule = new Module({
      title,
      content,
      slides: parsedSlides,
      quizzes: parsedQuizzes,
      createdBy: req.user.userId,
    });

    await newModule.save();
    res.status(201).json({ message: "Module created successfully!", module: newModule });
  } catch (error) {
    console.error("Error creating module:", error);
    //res.status(500).json({ error: "Error creating module" });
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: "Validation error: " + error.message });
    } else if (error.name === 'MongoServerError' && error.code === 16) {
      res.status(400).json({ error: "Document too large. Try reducing image sizes or number of slides." });
    } else {
      res.status(500).json({ error: "Error creating module: " + error.message });
    }
  }
});

router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ✅ Fetch All Modules - No authentication required for public listing
router.get("/public", async (req, res) => {
  try {
    const modules = await Module.find().select("title content createdAt").sort({ createdAt: -1 });
    res.json(modules);
  } catch (error) {
    console.error("Error fetching public modules:", error);
    res.status(500).json({ error: "Error fetching public modules" });
  }
});

// ✅ Fetch All Modules - For authenticated users
router.get("/", authMiddleware, async (req, res) => {
  try {
    let modules;

    // Admin can view all modules
    if (req.user.role === "admin") {
      modules = await Module.find().populate("createdBy", "name email");
    } else {
      // Regular user can view all modules
      modules = await Module.find().populate("createdBy", "name email");
    }

    res.json(modules);
  } catch (error) {
    console.error("Error fetching modules:", error);
    res.status(500).json({ error: "Error fetching modules" });
  }
});

// ✅ Fetch a Specific Module
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }
    res.json(module);
  } catch (error) {
    console.error("Error fetching module:", error);
    res.status(500).json({ error: "Error fetching module" });
  }
});

// ✅ Update a Module (Admin Only)
router.put("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, content, slides, quizzes } = req.body;
    const updatedModule = await Module.findByIdAndUpdate(
      req.params.id,
      { title, content, slides, quizzes },
      { new: true }
    );

    if (!updatedModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json({ message: "Module updated successfully!", module: updatedModule });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ error: "Error updating module" });
  }
});

// ✅ Delete a Module (Admin Only)
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const deletedModule = await Module.findByIdAndDelete(req.params.id);

    if (!deletedModule) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json({ message: "Module deleted successfully!" });
  } catch (error) {
    console.error("Error deleting module:", error);
    res.status(500).json({ error: "Error deleting module" });
  }
});

module.exports = router;
