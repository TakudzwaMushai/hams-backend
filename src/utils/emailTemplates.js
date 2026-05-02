exports.appointmentBookedPatient = ({ patient, doctor, slot }) => ({
  subject: "HAMS — Appointment Confirmed",
  html: `
    <h2>Appointment Confirmed</h2>
    <p>Hi ${patient.first_name},</p>
    <p>Your appointment has been booked successfully.</p>
    <table>
      <tr><td><strong>Doctor:</strong></td><td>Dr. ${doctor.first_name} ${doctor.last_name}</td></tr>
      <tr><td><strong>Specialisation:</strong></td><td>${doctor.specialisation}</td></tr>
      <tr><td><strong>Date:</strong></td><td>${new Date(slot.slot_date).toDateString()}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${slot.start_time} - ${slot.end_time}</td></tr>
    </table>
    <p>Please arrive 10 minutes early.</p>
  `,
});

exports.appointmentBookedDoctor = ({ patient, doctor, slot }) => ({
  subject: "HAMS — New Appointment Booked",
  html: `
    <h2>New Appointment</h2>
    <p>Hi Dr. ${doctor.first_name},</p>
    <p>A new appointment has been booked.</p>
    <table>
      <tr><td><strong>Patient:</strong></td><td>${patient.first_name} ${patient.last_name}</td></tr>
      <tr><td><strong>Date:</strong></td><td>${new Date(slot.slot_date).toDateString()}</td></tr>
      <tr><td><strong>Time:</strong></td><td>${slot.start_time} - ${slot.end_time}</td></tr>
    </table>
  `,
});

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
