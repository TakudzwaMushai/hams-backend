const colors = {
  teal: "#0F93A5",
  navy: "#223A6A",
  ink: "#172033",
  muted: "#5D6B82",
  line: "#DDEAF0",
  surface: "#F4FAFB",
  softTeal: "#E6F6F8",
  danger: "#B42318",
  dangerBg: "#FEF3F2",
  warning: "#B54708",
  warningBg: "#FFFAEB",
  success: "#067647",
  successBg: "#ECFDF3",
  white: "#FFFFFF",
};

const fontFamily =
  "Arial, Helvetica, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const formatDate = (date) => new Date(date).toDateString();

const formatMoney = (amount) =>
  amount || amount === 0 ? `£${Number(amount).toFixed(2)}` : "Not specified";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const titleCase = (value) =>
  String(value || "Not specified")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const paragraph = (content) => `
  <p style="margin:0 0 16px;color:${colors.muted};font-size:15px;line-height:24px;">
    ${content}
  </p>
`;

const sectionTitle = (content) => `
  <h3 style="margin:28px 0 12px;color:${colors.ink};font-size:16px;line-height:22px;font-weight:700;">
    ${content}
  </h3>
`;

const statusPill = (label, tone = "success") => {
  const palette =
    tone === "danger"
      ? { bg: colors.dangerBg, fg: colors.danger }
      : tone === "warning"
        ? { bg: colors.warningBg, fg: colors.warning }
        : { bg: colors.successBg, fg: colors.success };

  return `
    <span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${palette.bg};color:${palette.fg};font-size:12px;font-weight:700;line-height:16px;">
      ${escapeHtml(label)}
    </span>
  `;
};

const actionButton = ({ href, label }) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 8px;">
    <tr>
      <td bgcolor="${colors.teal}" style="border-radius:8px;">
        <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:13px 18px;color:${colors.white};font-family:${fontFamily};font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

const detailRows = (rows = []) =>
  rows
    .filter((row) => row && row.value !== undefined && row.value !== null)
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${colors.line};color:${colors.muted};font-size:13px;line-height:20px;width:42%;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:14px;line-height:20px;font-weight:700;">
            ${value}
          </td>
        </tr>
      `,
    )
    .join("");

const detailsTable = (rows = []) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:8px 0 4px;">
    ${detailRows(rows)}
  </table>
`;

const contentCard = (content) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;background:${colors.white};border:1px solid ${colors.line};border-radius:12px;">
    <tr>
      <td style="padding:24px;">
        ${content}
      </td>
    </tr>
  </table>
`;

const summaryStat = ({ label, value, tone = "normal" }) => {
  const fg =
    tone === "danger"
      ? colors.danger
      : tone === "warning"
        ? colors.warning
        : colors.navy;

  return `
    <td width="33.33%" style="padding:10px;border:1px solid ${colors.line};background:${colors.surface};">
      <div style="color:${colors.muted};font-size:12px;line-height:16px;">${escapeHtml(label)}</div>
      <div style="margin-top:4px;color:${fg};font-size:22px;line-height:28px;font-weight:800;">${escapeHtml(value)}</div>
    </td>
  `;
};

const summaryGrid = (items) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:20px 0 6px;">
    <tr>
      ${items.map(summaryStat).join("")}
    </tr>
  </table>
`;

const emailLayout = ({ preheader, eyebrow, title, body, footerNote }) => {
  return `
<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${colors.surface};font-family:${fontFamily};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader || title)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${colors.surface};border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;border-spacing:0;background:${colors.navy};background-image:linear-gradient(135deg, ${colors.teal}, ${colors.navy});border-radius:16px 16px 0 0;">
                  <tr>
                    <td style="padding:24px 26px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <span style="display:inline-block;vertical-align:middle;color:${colors.white};font-size:22px;line-height:28px;font-weight:800;letter-spacing:0;">HAMS</span>
                          </td>
                          <td align="right" style="vertical-align:middle;color:#D8F5F8;font-size:12px;line-height:18px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;">
                            Healthcare appointments
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${colors.white};border-left:1px solid ${colors.line};border-right:1px solid ${colors.line};border-collapse:collapse;">
                  <tr>
                    <td style="padding:30px 28px 12px;">
                      <div style="margin:0 0 8px;color:${colors.teal};font-size:12px;line-height:18px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">
                        ${escapeHtml(eyebrow || "HAMS")}
                      </div>
                      <h1 style="margin:0;color:${colors.ink};font-size:28px;line-height:36px;font-weight:800;letter-spacing:0;">
                        ${escapeHtml(title)}
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 28px 30px;">
                      ${body}
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${colors.ink};border-radius:0 0 16px 16px;border-collapse:collapse;">
                  <tr>
                    <td style="padding:18px 26px;color:#C9D3E1;font-size:12px;line-height:20px;">
                      ${escapeHtml(footerNote || "This message was sent by HAMS. If something does not look right, contact the healthcare provider directly.")}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

const buildBookedSlotsRows = ({ appointments = [], slots = [] }) =>
  slots
    .map((slot, index) => {
      const appointment = appointments[index];

      return `
        <tr>
          <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.muted};font-size:13px;">${index + 1}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;font-weight:700;">${escapeHtml(formatDate(slot.slot_date))}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(slot.start_time)} - ${escapeHtml(slot.end_time)}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(titleCase(slot.consultation_type))}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(slot.location || "Online")}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(formatMoney(slot.fee))}</td>
          <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.muted};font-size:12px;">${escapeHtml(appointment?._id || "Pending")}</td>
        </tr>
      `;
    })
    .join("");

const scheduleTable = ({ appointments = [], slots = [] }) => `
  ${sectionTitle("Confirmed schedule")}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid ${colors.line};border-radius:10px;overflow:hidden;">
    <tr>
      ${["#", "Date", "Time", "Type", "Location", "Fee", "Appointment ID"]
        .map(
          (heading) => `
            <th align="left" style="padding:11px 10px;background:${colors.softTeal};border-bottom:1px solid ${colors.line};color:${colors.navy};font-size:12px;line-height:16px;font-weight:800;">
              ${heading}
            </th>
          `,
        )
        .join("")}
    </tr>
    ${buildBookedSlotsRows({ appointments, slots })}
  </table>
`;

const buildUnavailableDates = (unavailableDates = []) => {
  if (!unavailableDates.length) return "";

  return contentCard(`
    ${sectionTitle("Unavailable repeat dates")}
    ${paragraph("These requested repeat dates were not booked because matching doctor-created slots were not available.")}
    <ul style="margin:0;padding:0 0 0 20px;color:${colors.warning};font-size:14px;line-height:24px;">
      ${unavailableDates
        .map((date) => `<li>${escapeHtml(formatDate(date))}</li>`)
        .join("")}
    </ul>
  `);
};

const getBookingSummary = ({
  appointments = [],
  repeat,
  unavailable_dates = [],
}) => {
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

const appointmentDetails = ({
  patient,
  doctor,
  slot,
  appointment,
  includePatient,
}) =>
  detailsTable([
    includePatient
      ? {
          label: "Patient",
          value: escapeHtml(`${patient.first_name} ${patient.last_name}`),
        }
      : {
          label: "Doctor",
          value: `Dr. ${escapeHtml(doctor.first_name)} ${escapeHtml(doctor.last_name)}`,
        },
    !includePatient && {
      label: "Specialisation",
      value: escapeHtml(doctor.specialisation || "Not specified"),
    },
    { label: "Date", value: escapeHtml(formatDate(slot.slot_date)) },
    {
      label: "Time",
      value: `${escapeHtml(slot.start_time)} - ${escapeHtml(slot.end_time)}`,
    },
    {
      label: "Type",
      value: escapeHtml(titleCase(slot.consultation_type || appointment?.type)),
    },
    { label: "Location", value: escapeHtml(slot.location || "Online") },
    appointment && {
      label: "Appointment ID",
      value: escapeHtml(appointment._id),
    },
  ]);

exports.verifyEmail = ({ firstName, verifyUrl, expiresIn = "24 hours" }) => ({
  subject: "HAMS - Verify Your Email",
  html: emailLayout({
    eyebrow: "Welcome",
    title: "Verify your email",
    preheader:
      "Confirm your email address to finish setting up your HAMS account.",
    body: `
      ${paragraph(`Hi ${escapeHtml(firstName || "there")}, welcome to HAMS. Please verify your email address to finish creating your account.`)}
      ${actionButton({ href: verifyUrl, label: "Verify email" })}
      ${paragraph(`This secure link expires in <strong style="color:${colors.ink};">${escapeHtml(expiresIn)}</strong>. If you did not create an account, you can ignore this email.`)}
      ${contentCard(`<div style="color:${colors.muted};font-size:12px;line-height:20px;word-break:break-all;">${escapeHtml(verifyUrl)}</div>`)}
    `,
  }),
});

exports.passwordReset = ({ resetUrl, expiresIn = "1 hour" }) => ({
  subject: "HAMS - Password Reset Request",
  html: emailLayout({
    eyebrow: "Security",
    title: "Reset your password",
    preheader: "Use this secure link to set a new HAMS password.",
    body: `
      ${paragraph("We received a request to reset your HAMS password. Use the button below to choose a new password.")}
      ${actionButton({ href: resetUrl, label: "Reset password" })}
      ${paragraph(`This link expires in <strong style="color:${colors.ink};">${escapeHtml(expiresIn)}</strong>. If you did not request a password reset, you can safely ignore this email.`)}
      ${contentCard(`<div style="color:${colors.muted};font-size:12px;line-height:20px;word-break:break-all;">${escapeHtml(resetUrl)}</div>`)}
    `,
  }),
});

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
  const title = summary.isPartial
    ? "Appointment partially confirmed"
    : "Appointment confirmed";

  return {
    subject: summary.isPartial
      ? "HAMS - Appointment Partially Confirmed"
      : "HAMS - Appointment Confirmed",
    html: emailLayout({
      eyebrow: "Booking update",
      title,
      preheader: `${summary.confirmedCount} appointment${summary.confirmedCount === 1 ? "" : "s"} confirmed with Dr. ${doctor.last_name}.`,
      body: `
        ${paragraph(`Hi ${escapeHtml(patient.first_name)}, your ${summary.isRecurring ? "recurring appointment request" : "appointment"} has been processed.`)}
        ${detailsTable([
          {
            label: "Doctor",
            value: `Dr. ${escapeHtml(doctor.first_name)} ${escapeHtml(doctor.last_name)}`,
          },
          { label: "Specialisation", value: escapeHtml(doctor.specialisation) },
          {
            label: "Booking status",
            value: statusPill(
              summary.isPartial ? "Partially confirmed" : "Confirmed",
              summary.isPartial ? "warning" : "success",
            ),
          },
          { label: "Repeat", value: escapeHtml(titleCase(summary.frequency)) },
        ])}
        ${summaryGrid([
          { label: "Requested", value: summary.requestedCount },
          { label: "Confirmed", value: summary.confirmedCount },
          {
            label: "Unavailable",
            value: summary.unavailableCount,
            tone: summary.unavailableCount ? "warning" : "normal",
          },
        ])}
        ${scheduleTable({ appointments, slots: confirmedSlots })}
        ${buildUnavailableDates(unavailable_dates)}
        ${paragraph("Please arrive 10 minutes early for in-person appointments. For online appointments, join from a quiet place with a stable connection.")}
      `,
    }),
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
      ? "HAMS - New Appointments Partially Booked"
      : "HAMS - New Appointment Booked",
    html: emailLayout({
      eyebrow: "Doctor schedule",
      title: summary.isRecurring
        ? "New recurring appointment"
        : "New appointment",
      preheader: `${patient.first_name} ${patient.last_name} booked ${summary.confirmedCount} appointment${summary.confirmedCount === 1 ? "" : "s"}.`,
      body: `
        ${paragraph(`Hi Dr. ${escapeHtml(doctor.first_name)}, ${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)} has booked ${summary.confirmedCount} appointment${summary.confirmedCount === 1 ? "" : "s"}.`)}
        ${detailsTable([
          {
            label: "Patient",
            value: `${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)}`,
          },
          {
            label: "Booking status",
            value: statusPill(
              summary.isPartial ? "Partially confirmed" : "Confirmed",
              summary.isPartial ? "warning" : "success",
            ),
          },
          { label: "Repeat", value: escapeHtml(titleCase(summary.frequency)) },
        ])}
        ${summaryGrid([
          { label: "Requested", value: summary.requestedCount },
          { label: "Confirmed", value: summary.confirmedCount },
          {
            label: "Unavailable",
            value: summary.unavailableCount,
            tone: summary.unavailableCount ? "warning" : "normal",
          },
        ])}
        ${scheduleTable({ appointments, slots: confirmedSlots })}
        ${buildUnavailableDates(unavailable_dates)}
      `,
    }),
  };
};

exports.appointmentCancelledPatient = ({ patient, doctor, slot, reason }) => ({
  subject: "HAMS - Appointment Cancelled",
  html: emailLayout({
    eyebrow: "Cancellation",
    title: "Appointment cancelled",
    preheader: `Your appointment with Dr. ${doctor.last_name} has been cancelled.`,
    body: `
      ${paragraph(`Hi ${escapeHtml(patient.first_name)}, your appointment with Dr. ${escapeHtml(doctor.first_name)} ${escapeHtml(doctor.last_name)} has been cancelled.`)}
      ${contentCard(
        appointmentDetails({
          patient,
          doctor,
          slot,
          includePatient: false,
        }) +
          (reason
            ? detailsTable([{ label: "Reason", value: escapeHtml(reason) }])
            : ""),
      )}
      ${paragraph("You can book a new appointment whenever you are ready.")}
    `,
  }),
});

exports.appointmentCancelledDoctor = ({ patient, doctor, slot, reason }) => ({
  subject: "HAMS - Appointment Cancelled",
  html: emailLayout({
    eyebrow: "Schedule update",
    title: "Appointment cancelled",
    preheader: `The appointment with ${patient.first_name} ${patient.last_name} has been cancelled.`,
    body: `
      ${paragraph(`Hi Dr. ${escapeHtml(doctor.first_name)}, the appointment with ${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)} has been cancelled.`)}
      ${contentCard(
        appointmentDetails({
          patient,
          doctor,
          slot,
          includePatient: true,
        }) +
          (reason
            ? detailsTable([{ label: "Reason", value: escapeHtml(reason) }])
            : ""),
      )}
    `,
  }),
});

exports.appointmentRescheduledPatient = ({
  patient,
  doctor,
  oldSlot,
  newSlot,
}) => ({
  subject: "HAMS - Appointment Rescheduled",
  html: emailLayout({
    eyebrow: "Schedule update",
    title: "Appointment rescheduled",
    preheader: `Your appointment with Dr. ${doctor.last_name} has a new time.`,
    body: `
      ${paragraph(`Hi ${escapeHtml(patient.first_name)}, your appointment with Dr. ${escapeHtml(doctor.first_name)} ${escapeHtml(doctor.last_name)} has been rescheduled.`)}
      ${contentCard(
        detailsTable([
          {
            label: "Old appointment",
            value: `${escapeHtml(formatDate(oldSlot.slot_date))} at ${escapeHtml(oldSlot.start_time)}`,
          },
          {
            label: "New appointment",
            value: `${escapeHtml(formatDate(newSlot.slot_date))} at ${escapeHtml(newSlot.start_time)} - ${escapeHtml(newSlot.end_time)}`,
          },
          {
            label: "Type",
            value: escapeHtml(titleCase(newSlot.consultation_type)),
          },
          {
            label: "Location",
            value: escapeHtml(newSlot.location || "Online"),
          },
        ]),
      )}
    `,
  }),
});

exports.appointmentRescheduledDoctor = ({
  patient,
  doctor,
  oldSlot,
  newSlot,
}) => ({
  subject: "HAMS - Appointment Rescheduled",
  html: emailLayout({
    eyebrow: "Schedule update",
    title: "Appointment rescheduled",
    preheader: `An appointment with ${patient.first_name} ${patient.last_name} has been rescheduled.`,
    body: `
      ${paragraph(`Hi Dr. ${escapeHtml(doctor.first_name)}, an appointment with ${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)} has been rescheduled.`)}
      ${contentCard(
        detailsTable([
          {
            label: "Patient",
            value: `${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)}`,
          },
          {
            label: "Old appointment",
            value: `${escapeHtml(formatDate(oldSlot.slot_date))} at ${escapeHtml(oldSlot.start_time)}`,
          },
          {
            label: "New appointment",
            value: `${escapeHtml(formatDate(newSlot.slot_date))} at ${escapeHtml(newSlot.start_time)} - ${escapeHtml(newSlot.end_time)}`,
          },
          {
            label: "Type",
            value: escapeHtml(titleCase(newSlot.consultation_type)),
          },
          {
            label: "Location",
            value: escapeHtml(newSlot.location || "Online"),
          },
        ]),
      )}
    `,
  }),
});

exports.appointmentReminderPatient = ({
  patient,
  doctor,
  slot,
  appointment,
}) => ({
  subject: "HAMS - Appointment Reminder",
  html: emailLayout({
    eyebrow: "Reminder",
    title: "Your appointment starts soon",
    preheader: "Your HAMS appointment starts in about one hour.",
    body: `
      ${paragraph(`Hi ${escapeHtml(patient.first_name)}, this is a reminder that your appointment starts in about one hour.`)}
      ${contentCard(
        appointmentDetails({
          patient,
          doctor,
          slot,
          appointment,
          includePatient: false,
        }),
      )}
      ${paragraph("Please arrive 10 minutes early for in-person appointments. For online appointments, keep your device charged and your connection stable.")}
    `,
  }),
});

exports.appointmentReminderDoctor = ({
  patient,
  doctor,
  slot,
  appointment,
}) => ({
  subject: "HAMS - Upcoming Appointment Reminder",
  html: emailLayout({
    eyebrow: "Reminder",
    title: "Upcoming appointment",
    preheader: `Your appointment with ${patient.first_name} ${patient.last_name} starts in about one hour.`,
    body: `
      ${paragraph(`Hi Dr. ${escapeHtml(doctor.first_name)}, this is a reminder that you have an appointment starting in about one hour.`)}
      ${contentCard(
        appointmentDetails({
          patient,
          doctor,
          slot,
          appointment,
          includePatient: true,
        }),
      )}
    `,
  }),
});

exports.appointmentCompleted = ({ patient, doctor, ehr }) => ({
  subject: "HAMS - Appointment Summary & Prescription",
  html: emailLayout({
    eyebrow: "Clinical summary",
    title: "Appointment summary",
    preheader: `Your appointment with Dr. ${doctor.last_name} is complete.`,
    body: `
      ${paragraph(`Hi ${escapeHtml(patient.first_name)}, your appointment with Dr. ${escapeHtml(doctor.first_name)} ${escapeHtml(doctor.last_name)} is now complete.`)}
      ${contentCard(`
        ${sectionTitle("Diagnosis")}
        ${paragraph(escapeHtml(ehr.diagnosis))}
        ${ehr.notes ? `${sectionTitle("Doctor's notes")}${paragraph(escapeHtml(ehr.notes))}` : ""}
      `)}
      ${
        ehr.prescriptions?.length > 0
          ? `
            ${sectionTitle("Prescriptions")}
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border:1px solid ${colors.line};">
              <tr>
                ${["Medication", "Dosage", "Frequency", "Duration"]
                  .map(
                    (heading) => `
                      <th align="left" style="padding:11px 10px;background:${colors.softTeal};border-bottom:1px solid ${colors.line};color:${colors.navy};font-size:12px;font-weight:800;">
                        ${heading}
                      </th>
                    `,
                  )
                  .join("")}
              </tr>
              ${ehr.prescriptions
                .map(
                  (p) => `
                    <tr>
                      <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(p.medication)}</td>
                      <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(p.dosage)}</td>
                      <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(p.frequency)}</td>
                      <td style="padding:12px 10px;border-bottom:1px solid ${colors.line};color:${colors.ink};font-size:13px;">${escapeHtml(p.duration)}</td>
                    </tr>
                  `,
                )
                .join("")}
            </table>
          `
          : ""
      }
      ${paragraph("Please follow the prescribed treatment and contact your healthcare provider if you have any concerns.")}
    `,
  }),
});
