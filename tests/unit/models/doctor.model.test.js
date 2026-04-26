const db = require('../../setup/db');
const Doctor = require('../../../src/models/Doctor');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('Doctor Model', () => {
  const validDoctor = {
    first_name:     'Alan',
    last_name:      'Carter',
    email:          'a.carter@hospital.nhs.uk',
    specialisation: 'General Practitioner',
    license_number: 'GMC-1234567'
  };

  it('should create a doctor with required fields', async () => {
    const doctor = await Doctor.create(validDoctor);
    expect(doctor._id).toBeDefined();
    expect(doctor.is_active).toBe(true);
    expect(doctor.specialisation).toBe('General Practitioner');
  });

  it('should fail if specialisation is missing', async () => {
    const { specialisation, ...data } = validDoctor;
    await expect(Doctor.create(data)).rejects.toThrow();
  });

  it('should fail if license_number is missing', async () => {
    const { license_number, ...data } = validDoctor;
    await expect(Doctor.create(data)).rejects.toThrow();
  });

  it('should fail on duplicate license_number', async () => {
    await Doctor.create(validDoctor);
    await expect(Doctor.create({ ...validDoctor, email: 'other@nhs.uk' })).rejects.toThrow();
  });

  it('should fail on duplicate email', async () => {
    await Doctor.create(validDoctor);
    await expect(Doctor.create({ ...validDoctor, license_number: 'GMC-9999999' })).rejects.toThrow();
  });

  it('should default is_active to true', async () => {
    const doctor = await Doctor.create(validDoctor);
    expect(doctor.is_active).toBe(true);
  });

  it('should allow setting is_active to false', async () => {
    const doctor = await Doctor.create({ ...validDoctor, is_active: false });
    expect(doctor.is_active).toBe(false);
  });
});