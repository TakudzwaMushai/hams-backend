const mongoose = require('mongoose');
const db = require('../../setup/db');
const User = require('../../../src/models/User');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('User Model', () => {
  const validUser = {
    email: 'test@example.com',
    password_hash: 'hashedpassword123',
    role: 'patient',
    ref_id: new mongoose.Types.ObjectId(),
    ref_type: 'Patient'
  };

  it('should create a user successfully with valid fields', async () => {
    const user = await User.create(validUser);
    expect(user._id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('patient');
    expect(user.last_login).toBeNull();
    expect(user.created_at).toBeDefined();
  });

  it('should lowercase the email automatically', async () => {
    const user = await User.create({ ...validUser, email: 'TEST@EXAMPLE.COM' });
    expect(user.email).toBe('test@example.com');
  });

  it('should fail if email is missing', async () => {
    const { email, ...noEmail } = validUser;
    await expect(User.create(noEmail)).rejects.toThrow();
  });

  it('should fail if password_hash is missing', async () => {
    const { password_hash, ...noPass } = validUser;
    await expect(User.create(noPass)).rejects.toThrow();
  });

  it('should fail if role is invalid', async () => {
    await expect(User.create({ ...validUser, role: 'superadmin' })).rejects.toThrow();
  });

  it('should fail if ref_type is invalid', async () => {
    await expect(User.create({ ...validUser, ref_type: 'nurse' })).rejects.toThrow();
  });

  it('should fail on duplicate email', async () => {
    await User.create(validUser);
    await expect(User.create(validUser)).rejects.toThrow();
  });

  it('should accept all valid roles', async () => {
    const roles = ['patient', 'doctor', 'admin'];
    for (const role of roles) {
      const user = await User.create({
        ...validUser,
        email: `${role}@example.com`,
        role
      });
      expect(user.role).toBe(role);
      await User.deleteOne({ _id: user._id });
    }
  });
});