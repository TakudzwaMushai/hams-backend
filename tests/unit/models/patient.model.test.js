const db = require('../../setup/db');
const Patient = require('../../../src/models/Patient');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe('Patient Model', () => {
  const validPatient = {
    first_name: 'Jane',
    last_name:  'Smith',
    email:      'jane@example.com'
  };

  it('should create a patient with required fields only', async () => {
    const patient = await Patient.create(validPatient);
    expect(patient._id).toBeDefined();
    expect(patient.first_name).toBe('Jane');
    expect(patient.last_name).toBe('Smith');
    expect(patient.email).toBe('jane@example.com');
  });

  it('should create a patient with all fields', async () => {
    const patient = await Patient.create({
      ...validPatient,
      phone:         '+44 7700 900001',
      date_of_birth: new Date('1992-03-22'),
      gender:        'female',
      nhs_number:    '485 777 3457',
      address: {
        line1:    '45 Maple Road',
        city:     'Kingston',
        postcode: 'KT1 2AB'
      }
    });
    expect(patient.gender).toBe('female');
    expect(patient.address.city).toBe('Kingston');
    expect(patient.nhs_number).toBe('485 777 3457');
  });

  it('should fail if first_name is missing', async () => {
    const { first_name, ...data } = validPatient;
    await expect(Patient.create(data)).rejects.toThrow();
  });

  it('should fail if last_name is missing', async () => {
    const { last_name, ...data } = validPatient;
    await expect(Patient.create(data)).rejects.toThrow();
  });

  it('should fail if email is missing', async () => {
    const { email, ...data } = validPatient;
    await expect(Patient.create(data)).rejects.toThrow();
  });

  it('should fail on duplicate email', async () => {
    await Patient.create(validPatient);
    await expect(Patient.create(validPatient)).rejects.toThrow();
  });

  it('should fail if gender is invalid', async () => {
    await expect(Patient.create({ ...validPatient, gender: 'unknown' })).rejects.toThrow();
  });
});