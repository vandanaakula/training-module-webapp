const express = require("express");
const mongoose = require("./database");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const moduleRoutes = require("./routes/moduleRoutes"); // Import Module Routes
const path = require('path');
const progressRoutes = require("./routes/progress");

require("dotenv").config();

const app = express();
app.use(cors(
 {
  origin: ["https://deploy-mern-1whq.vercel.app"],
  methods: ["POST", "GET"],
  credentials: true
 }
));
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/auth", authRoutes);  // Connect authentication routes
app.use("/modules", moduleRoutes);
app.use("/progress", progressRoutes);

 // Connect Routes
//app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Training Module API is running...");
});
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
console.log("JWT Secret Key:", process.env.JWT_SECRET);

