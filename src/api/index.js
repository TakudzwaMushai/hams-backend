require("dotenv").config();
const app = require("../src/app");
const connectDB = require("../src/config/db");

const startServer = async () => {
  try {
    await connectDB(); // 🔥 WAIT for DB

    console.log("MongoDB connected");

    module.exports = app;
  } catch (err) {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
  }
};

startServer();