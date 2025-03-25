// Create this as routes/progress.js
const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const Module = require("../models/Module");
const User = require("../models/User");
const mongoose = require("mongoose");

// Create or update user progress schema
const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Module",
    required: true
  },
  completedSlides: [Number], // Array of completed slide indexes
  lastSlideIndex: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started"
  },
  quizResults: {
    latestScore: Number,
    attemptsCount: {
      type: Number,
      default: 0
    },
    lastAttemptDate: Date,
    answers: Object // Store the latest answers
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a unique compound index
userProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

const UserProgress = mongoose.model("UserProgress", userProgressSchema);

// Mark a slide as completed
router.post("/slide-complete", authMiddleware, async (req, res) => {
  try {
    const { moduleId, slideIndex } = req.body;
    const userId = req.user.userId;

    if (!moduleId || slideIndex === undefined) {
      return res.status(400).json({ error: "Module ID and slide index are required" });
    }

    // Get the module to check total slides
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const totalSlides = module.slides.length;

    // Find the user's progress for this module, or create if it doesn't exist
    let progress = await UserProgress.findOne({ userId, moduleId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        moduleId,
        completedSlides: [],
        status: "In Progress"
      });
    }

    // Add the slide to completed slides if not already there
    if (!progress.completedSlides.includes(slideIndex)) {
      progress.completedSlides.push(slideIndex);
    }
    
    // Update the last viewed slide
    progress.lastSlideIndex = slideIndex;
    
    // Update status
    if (progress.completedSlides.length === 0) {
      progress.status = "Not Started";
    } else if (progress.completedSlides.length === totalSlides) {
      progress.status = "Completed";
    } else {
      progress.status = "In Progress";
    }

    progress.updatedAt = Date.now();
    await progress.save();

    res.json({ 
      message: "Progress updated", 
      progress: {
        completedSlides: progress.completedSlides,
        totalSlides,
        percentComplete: Math.round((progress.completedSlides.length / totalSlides) * 100),
        status: progress.status
      }
    });
  } catch (error) {
    console.error("Error updating slide progress:", error);
    res.status(500).json({ error: "Error updating progress" });
  }
});

router.post("/reset-quiz/:moduleId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const moduleId = req.params.moduleId;
  
      // Find the user's progress for this module
      const progress = await UserProgress.findOne({ userId, moduleId });
  
      if (!progress) {
        return res.status(404).json({ error: "Progress not found" });
      }
  
      // Reset quiz results and update status to "In Progress"
      progress.quizResults = null;
      progress.status = "In Progress"; // Ensure module can be restarted
      await progress.save();
  
      res.json({ 
        message: "Quiz results reset successfully",
        progress: {
          status: progress.status,
          completedSlides: progress.completedSlides,
          quizResults: null
        }
      });
    } catch (error) {
      console.error("Error resetting quiz results:", error);
      res.status(500).json({ error: "Error resetting quiz results" });
    }
});
  
// Save quiz results
router.post("/quiz-results", authMiddleware, async (req, res) => {
  try {
    const { moduleId, score, totalQuestions, answers } = req.body;
    const userId = req.user.userId;

    if (!moduleId || score === undefined || !totalQuestions) {
      return res.status(400).json({ error: "Module ID, score, and total questions are required" });
    }

    // Find the user's progress or create new
    let progress = await UserProgress.findOne({ userId, moduleId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        moduleId,
        completedSlides: [],
        status: "In Progress"
      });
    }

    // Update quiz results
    progress.quizResults = {
      latestScore: score,
      attemptsCount: (progress.quizResults?.attemptsCount || 0) + 1,
      lastAttemptDate: Date.now(),
      answers: answers
    };
    
    progress.updatedAt = Date.now();
    await progress.save();

    res.json({ 
      message: "Quiz results saved", 
      quizResults: progress.quizResults 
    });
  } catch (error) {
    console.error("Error saving quiz results:", error);
    res.status(500).json({ error: "Error saving quiz results" });
  }
});


// Get all progress for a user
router.get("/user", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      
      // Get all progress for this user
      const progress = await UserProgress.find({ userId }).lean();
      
      // Get all modules to calculate percentages
      const modules = await Module.find({}, 'title slides quizzes').lean();
      
      // Map the modules with their progress
      const modulesWithProgress = modules.map(module => {
        const userProgress = progress.find(p => p.moduleId.toString() === module._id.toString()) || {
          completedSlides: [],
          status: "Not Started",
          lastSlideIndex: 0,
          quizResults: null
        };
        
        const totalSlides = module.slides.length;
        const completedCount = userProgress.completedSlides ? userProgress.completedSlides.length : 0;
        
        return {
          _id: module._id,
          title: module.title,
          progress: {
            completedSlides: completedCount,
            totalSlides,
            percentComplete: totalSlides ? Math.round((completedCount / totalSlides) * 100) : 0,
            status: userProgress.status,
            lastSlideIndex: userProgress.lastSlideIndex,
            quizResults: userProgress.quizResults,
            hasTakenQuiz: Boolean(userProgress.quizResults)
          }
        };
      });
      
      res.json(modulesWithProgress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ error: "Error fetching progress" });
    }
  });

// Get progress for a specific module
router.get("/:moduleId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const moduleId = req.params.moduleId;
      
      // Get the module data
      const module = await Module.findById(moduleId);
      if (!module) {
        return res.status(404).json({ error: "Module not found" });
      }
      
      // Get the user progress for this module
      const progress = await UserProgress.findOne({ userId, moduleId });
      
      // Always return a progress object, even if no progress exists
      const baseProgress = {
        moduleId,
        completedSlides: progress ? progress.completedSlides : [],
        totalSlides: module.slides.length,
        percentComplete: progress 
          ? Math.round((progress.completedSlides.length / module.slides.length) * 100) 
          : 0,
        status: progress ? progress.status : "Not Started",
        lastSlideIndex: progress ? progress.lastSlideIndex : 0,
        quizResults: progress ? progress.quizResults : null,
        canRetake: true // Always allow module access
      };
      
      res.json(baseProgress);
    } catch (error) {
      console.error("Error fetching module progress:", error);
      res.status(500).json({ error: "Error fetching module progress" });
    }
  });

module.exports = router;