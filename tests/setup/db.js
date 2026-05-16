const mongoose = require('mongoose');
require('dotenv').config();

const TEST_URI = process.env.MONGO_URI.replace('/hamsdb', '/hamsdb_test');

const assertDatabaseTestsAllowed = () => {
  if (process.env.ALLOW_DATABASE_TESTS !== 'true') {
    throw new Error(
      'Database tests are disabled to protect MongoDB data. Set ALLOW_DATABASE_TESTS=true only when you intentionally want to run destructive database tests.',
    );
  }
};

const assertTestDatabase = () => {
  const dbName = mongoose.connection.name;

  if (process.env.NODE_ENV !== 'test' || !dbName || !dbName.includes('test')) {
    throw new Error(
      `Refusing to clean non-test database "${dbName || 'unknown'}"`,
    );
  }
};

const connect = async () => {
  assertDatabaseTestsAllowed();
  await mongoose.connect(TEST_URI);
  assertTestDatabase();
};

const disconnect = async () => {
  assertDatabaseTestsAllowed();
  assertTestDatabase();
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

const clearCollections = async () => {
  assertDatabaseTestsAllowed();
  assertTestDatabase();
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, disconnect, clearCollections };
