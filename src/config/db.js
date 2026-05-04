const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  // ✅ already connected
  if (cached.conn) return cached.conn;

  // ✅ connection in progress
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false, // 🔥 prevents 10s timeout issue
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
