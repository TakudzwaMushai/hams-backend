const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

// 🔥 global cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  // ✅ already connected
  if (cached.conn) {
    return cached.conn;
  }

  // ✅ connection in progress
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      bufferCommands: false, // 🔥 critical
      serverSelectionTimeoutMS: 5000, // fail fast
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null; // 🔥 reset so it can retry
    throw err;
  }
};

module.exports = connectDB;