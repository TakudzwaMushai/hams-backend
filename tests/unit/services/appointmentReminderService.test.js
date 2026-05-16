jest.mock("../../../src/models/Appointment", () => ({
  find: jest.fn(),
}));
jest.mock("../../../src/models/User", () => ({
  findOne: jest.fn(),
}));
jest.mock("../../../src/utils/sendEmail", () => jest.fn().mockResolvedValue());

const Appointment = require("../../../src/models/Appointment");
const User = require("../../../src/models/User");
const sendEmail = require("../../../src/utils/sendEmail");
const {
  sendAppointmentReminders,
} = require("../../../src/services/appointmentReminderService");

const buildFindChain = (appointments) => ({
  populate: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue(appointments),
});

describe("appointment reminder service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const appointmentStart = new Date("2026-05-20T09:00:00");
    jest
      .useFakeTimers()
      .setSystemTime(new Date(appointmentStart.getTime() - 60 * 60 * 1000));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends patient and doctor reminders for appointments one hour away", async () => {
    const appointment = {
      _id: "appointment-1",
      slot_id: {
        slot_date: new Date("2026-05-20T00:00:00.000Z"),
        start_time: "09:00",
        end_time: "09:30",
        consultation_type: "online",
      },
      patient_id: {
        _id: "patient-1",
        first_name: "Jane",
        last_name: "Smith",
        email: "patient@example.com",
      },
      doctor_id: {
        _id: "doctor-1",
        first_name: "Alan",
        last_name: "Carter",
        email: "doctor@example.com",
        specialisation: "GP",
      },
      save: jest.fn().mockResolvedValue(),
    };

    Appointment.find.mockReturnValue(buildFindChain([appointment]));
    User.findOne
      .mockResolvedValueOnce({ email: "patient-user@example.com" })
      .mockResolvedValueOnce({ email: "doctor-user@example.com" });

    await sendAppointmentReminders();

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ to: "patient-user@example.com" }),
    );
    expect(sendEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ to: "doctor-user@example.com" }),
    );
    expect(appointment.patient_reminder_sent_at).toBeInstanceOf(Date);
    expect(appointment.doctor_reminder_sent_at).toBeInstanceOf(Date);
    expect(appointment.save).toHaveBeenCalledTimes(2);
  });

  it("does not resend reminders that already have timestamps", async () => {
    const appointment = {
      _id: "appointment-1",
      slot_id: {
        slot_date: new Date("2026-05-20T00:00:00.000Z"),
        start_time: "09:00",
      },
      patient_id: { _id: "patient-1", first_name: "Jane", email: "p@test.com" },
      doctor_id: { _id: "doctor-1", first_name: "Alan", email: "d@test.com" },
      patient_reminder_sent_at: new Date(),
      doctor_reminder_sent_at: new Date(),
      save: jest.fn(),
    };

    Appointment.find.mockReturnValue(buildFindChain([appointment]));

    await sendAppointmentReminders();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(appointment.save).not.toHaveBeenCalled();
  });

  it("skips appointments outside the reminder window", async () => {
    const appointment = {
      _id: "appointment-1",
      slot_id: {
        slot_date: new Date("2026-05-20T00:00:00.000Z"),
        start_time: "12:00",
      },
      patient_id: { _id: "patient-1", first_name: "Jane", email: "p@test.com" },
      doctor_id: { _id: "doctor-1", first_name: "Alan", email: "d@test.com" },
      save: jest.fn(),
    };

    Appointment.find.mockReturnValue(buildFindChain([appointment]));

    await sendAppointmentReminders();

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
