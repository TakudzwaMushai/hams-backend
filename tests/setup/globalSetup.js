const db = require('./db');

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearCollections();
});

afterAll(async () => {
  await db.disconnect();
});