const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  await mongoose.connect(process.env.MONGO_URI);
};

module.exports = connectDB;
