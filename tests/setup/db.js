const mongoose = require('mongoose');
require('dotenv').config();

const TEST_URI = process.env.MONGO_URI.replace('/hamsdb', '/hamsdb_test');

const connect = async () => {
  await mongoose.connect(TEST_URI);
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

const clearCollections = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, disconnect, clearCollections };