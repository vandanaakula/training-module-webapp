const mongoose = require("mongoose");

// Slide Schema
const slideSchema = new mongoose.Schema({
  url: {
    type: String,
  },
  type: {
    type: String,
    enum: ["text", "image", "video", "image-text"],
    default: "text",
  },
  description: {
    type: String,
  },
  text: {
    type: String,
    required: function () {
      return this.type === "text" || this.type === "image-text";
    },
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

// Quiz Schema
const quizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["MCQ", "TF", "SHORT"],
    required: true,
  },
  options: {
    type: [String],
    validate: {
      validator: function (v) {
        return this.type !== "MCQ" || (Array.isArray(v) && v.length >= 2);
      },
      message: (props) => "MCQ questions require at least 2 options",
    },
  },
  correctAnswer: {
    type: String,
    required: true,
  },
});

// User Progress Schema
const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  completedSlides: {
    type: Number,
    default: 0,
  },
  totalSlides: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started",
  },
  hasTakenQuiz: {
    type: Boolean,
    default: false,
  },
  quizResults: {
    latestScore: {
      type: Number,
      default: 0,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
  },
});

// Module Schema
const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  slides: [slideSchema],
  quizzes: [quizSchema],
  progress: [userProgressSchema], // Track user progress per module
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster retrieval
moduleSchema.index({ createdBy: 1, createdAt: -1 });

// Auto-update updatedAt
moduleSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Module", moduleSchema);
