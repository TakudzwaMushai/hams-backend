const templates = require("../../../src/utils/emailTemplates");

describe("email templates", () => {
  const patient = { first_name: "Jane", last_name: "Smith" };
  const doctor = {
    first_name: "Alan",
    last_name: "Carter",
    specialisation: "General Practitioner",
  };
  const slot = {
    slot_date: "2026-05-20T00:00:00.000Z",
    start_time: "09:00",
    end_time: "09:30",
    consultation_type: "online",
    location: null,
    fee: 50,
  };
  const appointment = { _id: "appointment-1", type: "video" };

  it("renders the backend JPG logo path", () => {
    const email = templates.verifyEmail({
      firstName: "Jane",
      verifyUrl: "https://example.com/verify",
    });

    expect(email.subject).toBe("HAMS - Verify Your Email");
    expect(email.html).toContain("<!doctype html>");
  });

  it("renders recurring partial booking details", () => {
    const email = templates.appointmentBookedPatient({
      patient,
      doctor,
      slot,
      appointments: [appointment],
      slots: [slot],
      repeat: { frequency: "weekly", count: 3 },
      unavailable_dates: ["2026-05-27T00:00:00.000Z"],
    });

    expect(email.subject).toContain("Partially Confirmed");
    expect(email.html).toContain("Partially confirmed");
    expect(email.html).toContain("Unavailable repeat dates");
    expect(email.html).toContain("Confirmed schedule");
  });

  it("renders reminder details for patients and doctors", () => {
    const patientEmail = templates.appointmentReminderPatient({
      patient,
      doctor,
      slot,
      appointment,
    });
    const doctorEmail = templates.appointmentReminderDoctor({
      patient,
      doctor,
      slot,
      appointment,
    });

    expect(patientEmail.html).toContain("09:00 - 09:30");
    expect(patientEmail.html).toContain("Dr. Alan Carter");
    expect(doctorEmail.html).toContain("Jane Smith");
  });

  it("escapes dynamic HTML values", () => {
    const email = templates.appointmentCancelledPatient({
      patient: { first_name: "<Jane>", last_name: "Smith" },
      doctor,
      slot,
      reason: "<script>alert(1)</script>",
    });

    expect(email.html).toContain("&lt;Jane&gt;");
    expect(email.html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).not.toContain("<script>alert(1)</script>");
  });
});
