const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Protected route (for both admin and user)
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You have access to this protected route",
    user: req.user,
  });
});

// ✅ Signup Route (User/Admin Registration)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (default role is "user" if not provided)
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// ✅ Admin Login Route
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Check if user exists and is an admin
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admin credentials required" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // Longer session for admin
    );

    res.json({ token, userId: user._id, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Admin login failed" });
  }
});

// ✅ User Login Route
router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) return res.status(400).json({ error: "User not found" });

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    res.json({ token, userId: user._id, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ✅ Get User Info Route
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user data" });
  }
});

// ✅ Admin Dashboard Route (only accessible to admin)
router.get("/admin/dashboard", authMiddleware, isAdmin, (req, res) => {
  res.json({
    message: "Welcome to the admin dashboard!",
    user: req.user,
  });
});

module.exports = router;