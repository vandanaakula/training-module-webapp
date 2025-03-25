require("dotenv").config(); // Load environment variables
const jwt = require("jsonwebtoken");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2RiMTQzYjcxZGVmYWEzZTdlOWY2MGQiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDI2NTI0NjIsImV4cCI6MTc0MjY4MTI2Mn0.rFfXWSTSTZGXbKIpv3PrdTXhlLOruzzleAV6QOU4V-s" // Replace with your real token
const secret = process.env.JWT_SECRET; // Get the secret key from .env

if (!secret) {
  console.error("❌ Error: JWT_SECRET is not defined! Check your .env file.");
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, secret);
  console.log("✅ Token is valid:", decoded);
} catch (error) {
  console.log("❌ Error verifying token:", error.message);
}
