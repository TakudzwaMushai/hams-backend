const formatDate = (date) => new Date(date).toDateString();

const formatMoney = (amount) =>
  amount || amount === 0 ? `£${Number(amount).toFixed(2)}` : "Not specified";

const buildBookedSlotsRows = ({ appointments = [], slots = [] }) =>
  slots
    .map((slot, index) => {
      const appointment = appointments[index];

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${formatDate(slot.slot_date)}</td>
          <td>${slot.start_time} - ${slot.end_time}</td>
          <td>${slot.consultation_type || "Not specified"}</td>
          <td>${slot.location || "Online"}</td>
          <td>${formatMoney(slot.fee)}</td>
          <td>${appointment?._id || "Pending"}</td>
        </tr>
      `;
    })
    .join("");

const buildUnavailableDates = (unavailableDates = []) => {
  if (!unavailableDates.length) return "";

  return `
    <h3>Unavailable repeat dates</h3>
    <p>The following requested repeat dates were not booked because matching doctor-created slots were not available:</p>
    <ul>
      ${unavailableDates.map((date) => `<li>${formatDate(date)}</li>`).join("")}
    </ul>
  `;
};

const getBookingSummary = ({ appointments = [], repeat, unavailable_dates = [] }) => {
  const requestedCount = Number(repeat?.count || appointments.length || 1);
  const confirmedCount = appointments.length;
  const unavailableCount = unavailable_dates.length;
  const isRecurring = requestedCount > 1;
  const isPartial = unavailableCount > 0;

  return {
    requestedCount,
    confirmedCount,
    unavailableCount,
    isRecurring,
    isPartial,
    frequency: repeat?.frequency || "none",
  };
};

exports.appointmentBookedPatient = ({
  patient,
  doctor,
  slot,
  appointments = [],
  slots,
  repeat,
  unavailable_dates = [],
}) => {
  const confirmedSlots = slots?.length ? slots : [slot];
  const summary = getBookingSummary({
    appointments,
    repeat,
    unavailable_dates,
  });

  return {
    subject: summary.isPartial
      ? "HAMS — Appointment Partially Confirmed"
      : "HAMS — Appointment Confirmed",
  html: `
    <h2>${summary.isPartial ? "Appointment Partially Confirmed" : "Appointment Confirmed"}</h2>
    <p>Hi ${patient.first_name},</p>
    <p>Your ${summary.isRecurring ? "recurring appointment request" : "appointment"} has been processed.</p>
    <table>
      <tr><td><strong>Doctor:</strong></td><td>Dr. ${doctor.first_name} ${doctor.last_name}</td></tr>
      <tr><td><strong>Specialisation:</strong></td><td>${doctor.specialisation}</td></tr>
      <tr><td><strong>Booking status:</strong></td><td>${summary.isPartial ? "Partially confirmed" : "Confirmed"}</td></tr>
      <tr><td><strong>Repeat:</strong></td><td>${summary.frequency}</td></tr>
      <tr><td><strong>Requested appointments:</strong></td><td>${summary.requestedCount}</td></tr>
      <tr><td><strong>Confirmed appointments:</strong></td><td>${summary.confirmedCount}</td></tr>
      <tr><td><strong>Unavailable appointments:</strong></td><td>${summary.unavailableCount}</td></tr>
    </table>

    <h3>Confirmed schedule</h3>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Time</th>
        <th>Type</th>
        <th>Location</th>
        <th>Fee</th>
        <th>Appointment ID</th>
      </tr>
      ${buildBookedSlotsRows({ appointments, slots: confirmedSlots })}
    </table>

    ${buildUnavailableDates(unavailable_dates)}

    <p>Please arrive 10 minutes early.</p>
  `,
  };
};

exports.appointmentBookedDoctor = ({
  patient,
  doctor,
  slot,
  appointments = [],
  slots,
  repeat,
  unavailable_dates = [],
}) => {
  const confirmedSlots = slots?.length ? slots : [slot];
  const summary = getBookingSummary({
    appointments,
    repeat,
    unavailable_dates,
  });

  return {
    subject: summary.isPartial
      ? "HAMS — New Appointments Partially Booked"
      : "HAMS — New Appointment Booked",
  html: `
    <h2>${summary.isRecurring ? "New Recurring Appointment" : "New Appointment"}</h2>
    <p>Hi Dr. ${doctor.first_name},</p>
    <p>${patient.first_name} ${patient.last_name} has booked ${summary.confirmedCount} appointment${summary.confirmedCount === 1 ? "" : "s"}.</p>
    <table>
      <tr><td><strong>Patient:</strong></td><td>${patient.first_name} ${patient.last_name}</td></tr>
      <tr><td><strong>Booking status:</strong></td><td>${summary.isPartial ? "Partially confirmed" : "Confirmed"}</td></tr>
      <tr><td><strong>Repeat:</strong></td><td>${summary.frequency}</td></tr>
      <tr><td><strong>Requested appointments:</strong></td><td>${summary.requestedCount}</td></tr>
      <tr><td><strong>Confirmed appointments:</strong></td><td>${summary.confirmedCount}</td></tr>
      <tr><td><strong>Unavailable appointments:</strong></td><td>${summary.unavailableCount}</td></tr>
    </table>

    <h3>Confirmed schedule</h3>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Time</th>
        <th>Type</th>
        <th>Location</th>
        <th>Fee</th>
        <th>Appointment ID</th>
      </tr>
      ${buildBookedSlotsRows({ appointments, slots: confirmedSlots })}
    </table>

    ${buildUnavailableDates(unavailable_dates)}
  `,
  };
};

exports.appointmentCancelledPatient = ({ patient, doctor, slot, reason }) => ({
  subject: "HAMS — Appointment Cancelled",
  html: `
    <h2>Appointment Cancelled</h2>
    <p>Hi ${patient.first_name},</p>
    <p>Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} on 
    ${new Date(slot.slot_date).toDateString()} at ${slot.start_time} has been cancelled.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
    <p>You can book a new appointment at any time.</p>
  `,
});

exports.appointmentCancelledDoctor = ({ patient, doctor, slot, reason }) => ({
  subject: "HAMS — Appointment Cancelled",
  html: `
    <h2>Appointment Cancelled</h2>
    <p>Hi Dr. ${doctor.first_name},</p>
    <p>The appointment with ${patient.first_name} ${patient.last_name} on 
    ${new Date(slot.slot_date).toDateString()} at ${slot.start_time} has been cancelled.</p>
    ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
  `,
});

exports.appointmentRescheduledPatient = ({
  patient,
  doctor,
  oldSlot,
  newSlot,
}) => ({
  subject: "HAMS — Appointment Rescheduled",
  html: `
    <h2>Appointment Rescheduled</h2>
    <p>Hi ${patient.first_name},</p>
    <p>Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} has been rescheduled.</p>
    <table>
      <tr><td><strong>Old Date:</strong></td><td>${new Date(oldSlot.slot_date).toDateString()} at ${oldSlot.start_time}</td></tr>
      <tr><td><strong>New Date:</strong></td><td>${new Date(newSlot.slot_date).toDateString()} at ${newSlot.start_time}</td></tr>
    </table>
  `,
});

exports.appointmentRescheduledDoctor = ({
  patient,
  doctor,
  oldSlot,
  newSlot,
}) => ({
  subject: "HAMS — Appointment Rescheduled",
  html: `
    <h2>Appointment Rescheduled</h2>
    <p>Hi Dr. ${doctor.first_name},</p>
    <p>An appointment with ${patient.first_name} ${patient.last_name} has been rescheduled.</p>
    <table>
      <tr><td><strong>Old Date:</strong></td><td>${new Date(oldSlot.slot_date).toDateString()} at ${oldSlot.start_time}</td></tr>
      <tr><td><strong>New Date:</strong></td><td>${new Date(newSlot.slot_date).toDateString()} at ${newSlot.start_time}</td></tr>
    </table>
  `,
});

exports.appointmentReminderPatient = ({ patient, doctor, slot, appointment }) => ({
  subject: "HAMS — Appointment Reminder",
  html: `
    <h2>Appointment Reminder</h2>
    <p>Hi ${patient.first_name},</p>
    <p>This is a reminder that your appointment starts in about one hour.</p>
    <table>
      <tr><td><strong>Doctor:</strong></td><td>Dr. ${doctor.first_name} ${doctor.last_name}</td></tr>
      <tr><td><strong>Specialisation:</strong></td><td>${doctor.specialisation}</td></tr>
      <tr><td><strong>Date:</strong></td><td>${formatDate(slot.slot_date)}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${slot.start_time} - ${slot.end_time}</td></tr>
      <tr><td><strong>Type:</strong></td><td>${slot.consultation_type || appointment.type}</td></tr>
      <tr><td><strong>Location:</strong></td><td>${slot.location || "Online"}</td></tr>
      <tr><td><strong>Appointment ID:</strong></td><td>${appointment._id}</td></tr>
    </table>
    <p>Please arrive 10 minutes early for in-person appointments.</p>
  `,
});

exports.appointmentReminderDoctor = ({ patient, doctor, slot, appointment }) => ({
  subject: "HAMS — Upcoming Appointment Reminder",
  html: `
    <h2>Upcoming Appointment Reminder</h2>
    <p>Hi Dr. ${doctor.first_name},</p>
    <p>This is a reminder that you have an appointment starting in about one hour.</p>
    <table>
      <tr><td><strong>Patient:</strong></td><td>${patient.first_name} ${patient.last_name}</td></tr>
      <tr><td><strong>Date:</strong></td><td>${formatDate(slot.slot_date)}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${slot.start_time} - ${slot.end_time}</td></tr>
      <tr><td><strong>Type:</strong></td><td>${slot.consultation_type || appointment.type}</td></tr>
      <tr><td><strong>Location:</strong></td><td>${slot.location || "Online"}</td></tr>
      <tr><td><strong>Appointment ID:</strong></td><td>${appointment._id}</td></tr>
    </table>
  `,
});

exports.appointmentCompleted = ({ patient, doctor, ehr }) => ({
  subject: "HAMS — Appointment Summary & Prescription",
  html: `
    <h2>Appointment Summary</h2>
    <p>Hi ${patient.first_name},</p>
    <p>Your appointment with Dr. ${doctor.first_name} ${doctor.last_name} is now complete.</p>

    <h3>Diagnosis</h3>
    <p>${ehr.diagnosis}</p>

    ${ehr.notes ? `<h3>Doctor's Notes</h3><p>${ehr.notes}</p>` : ""}

    ${
      ehr.prescriptions?.length > 0
        ? `
      <h3>Prescriptions</h3>
      <table border="1" cellpadding="6">
        <tr>
          <th>Medication</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Duration</th>
        </tr>
        ${ehr.prescriptions
          .map(
            (p) => `
          <tr>
            <td>${p.medication}</td>
            <td>${p.dosage}</td>
            <td>${p.frequency}</td>
            <td>${p.duration}</td>
          </tr>
        `,
          )
          .join("")}
      </table>
    `
        : ""
    }
    <p>Please follow the prescribed treatment. Contact us if you have any concerns.</p>
  `,
});
