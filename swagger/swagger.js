const swaggerUi = require("swagger-ui-express");

const messageResponse = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
};

const validationErrorResponse = {
  type: "object",
  properties: {
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          value: {},
          msg: { type: "string" },
          path: { type: "string" },
          location: { type: "string" },
        },
      },
    },
  },
};

const authResponses = {
  401: {
    description: "Not authenticated",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  403: {
    description: "Not authorised",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
};

const serverError = {
  500: {
    description: "Server error",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
};

const paginationParameters = [
  {
    in: "query",
    name: "page",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    in: "query",
    name: "limit",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
  },
];

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "HAMS API",
    description: "Healthcare Appointment Management System API",
    version: "1.0.0",
  },
  servers: [
    {
      url: "https://hams-backend.vercel.app/api",
      description: "Production",
    },
    {
      url: "http://localhost:5000/api",
      description: "Local",
    },
  ],
  tags: [
    { name: "Auth" },
    { name: "Doctors" },
    { name: "Slots" },
    { name: "Appointments" },
    { name: "Reviews" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
      },
    },
    schemas: {
      MessageResponse: messageResponse,
      ValidationErrorResponse: validationErrorResponse,
      ErrorResponse: messageResponse,
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", example: 42 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total_pages: { type: "integer", example: 5 },
          totalItems: { type: "integer", example: 42 },
          currentPage: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 10 },
          totalPages: { type: "integer", example: 5 },
        },
      },
      Address: {
        type: "object",
        properties: {
          line1: { type: "string" },
          city: { type: "string" },
          postcode: { type: "string" },
        },
      },
      PatientProfile: {
        type: "object",
        properties: {
          _id: { type: "string" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          date_of_birth: { type: "string", format: "date" },
          gender: { type: "string", enum: ["male", "female", "other"] },
          nhs_number: { type: "string" },
          address: { $ref: "#/components/schemas/Address" },
        },
      },
      DoctorProfile: {
        type: "object",
        properties: {
          _id: { type: "string" },
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          specialisation: { type: "string" },
          license_number: { type: "string" },
          is_active: { type: "boolean" },
          experience_years: { type: "number" },
          fee: { type: "number" },
          education: { type: "string", nullable: true },
          certificate: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          avatar: { type: "string", nullable: true },
          availability_types: {
            type: "array",
            items: { type: "string", enum: ["Online Consultation", "In-Person"] },
          },
          clinic_name: { type: "string", nullable: true },
          average_rating: { type: "number" },
          total_reviews: { type: "number" },
        },
      },
      UserResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["patient", "doctor", "admin"] },
          is_verified: { type: "boolean" },
          last_login: { type: "string", format: "date-time", nullable: true },
          profile: {
            oneOf: [
              { $ref: "#/components/schemas/PatientProfile" },
              { $ref: "#/components/schemas/DoctorProfile" },
            ],
          },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        description:
          "Send editable patient or doctor profile fields. Fields can also be sent inside a profile object.",
        properties: {
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          profile_image: { type: "string" },
          date_of_birth: { type: "string", format: "date" },
          gender: { type: "string", enum: ["male", "female", "other"] },
          nhs_number: { type: "string" },
          address: { $ref: "#/components/schemas/Address" },
          specialisation: { type: "string" },
          license_number: { type: "string" },
          experience_years: { type: "number" },
          fee: { type: "number" },
          education: { type: "string" },
          certificate: { type: "string" },
          bio: { type: "string" },
          avatar: { type: "string" },
          availability_types: {
            type: "array",
            items: { type: "string", enum: ["Online Consultation", "In-Person"] },
          },
          clinic_name: { type: "string" },
          profile: {
            oneOf: [
              { $ref: "#/components/schemas/PatientProfile" },
              { $ref: "#/components/schemas/DoctorProfile" },
            ],
          },
        },
      },
      Repeat: {
        type: "object",
        properties: {
          frequency: {
            type: "string",
            enum: ["none", "daily", "weekly", "monthly"],
            example: "weekly",
          },
          count: { type: "integer", minimum: 1, maximum: 60, example: 6 },
        },
      },
      AvailabilitySlot: {
        type: "object",
        properties: {
          _id: { type: "string" },
          doctor_id: { type: "string" },
          slot_date: { type: "string", format: "date-time" },
          start_time: { type: "string", example: "09:00" },
          end_time: { type: "string", example: "09:30" },
          consultation_type: { type: "string", enum: ["online", "offline"] },
          location: { type: "string", nullable: true },
          fee: { type: "number", example: 50 },
          is_booked: { type: "boolean" },
          is_blocked: { type: "boolean" },
        },
      },
      Appointment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          patient_id: {
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/PatientProfile" },
            ],
          },
          doctor_id: {
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/DoctorProfile" },
            ],
          },
          slot_id: {
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/AvailabilitySlot" },
            ],
          },
          status: {
            type: "string",
            enum: ["confirmed", "cancelled", "completed", "rescheduled"],
          },
          type: { type: "string", enum: ["in-person", "video"] },
          notes: { type: "string", nullable: true },
          cancellation_reason: { type: "string", nullable: true },
          booked_at: { type: "string", format: "date-time" },
          is_reviewed: { type: "boolean" },
        },
      },
      Review: {
        type: "object",
        properties: {
          _id: { type: "string" },
          patient_id: {
            oneOf: [
              { type: "string" },
              { $ref: "#/components/schemas/PatientProfile" },
            ],
          },
          doctor_id: { type: "string" },
          appointment_id: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          comment: { type: "string" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      EHRRecord: {
        type: "object",
        properties: {
          _id: { type: "string" },
          patient_id: { type: "string" },
          doctor_id: { type: "string" },
          appointment_id: { type: "string" },
          diagnosis: { type: "string" },
          notes: { type: "string" },
          prescriptions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                medication: { type: "string" },
                dosage: { type: "string" },
                frequency: { type: "string" },
                duration: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/auth/signup": {
      post: {
        summary: "Register a new patient or doctor",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "role", "first_name", "last_name"],
                properties: {
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", example: "SecurePass123" },
                  role: { type: "string", enum: ["patient", "doctor"] },
                  first_name: { type: "string", example: "Jane" },
                  last_name: { type: "string", example: "Smith" },
                  phone: { type: "string" },
                  date_of_birth: { type: "string", format: "date" },
                  gender: { type: "string", enum: ["male", "female", "other"] },
                  nhs_number: { type: "string" },
                  address: { $ref: "#/components/schemas/Address" },
                  specialisation: { type: "string", example: "General Practitioner" },
                  license_number: { type: "string", example: "GMC-1234567" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Account created successfully" },
          409: { description: "Email already registered" },
          422: { description: "Validation errors" },
          ...serverError,
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Login and set httpOnly auth cookies",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "jane@example.com" },
                  password: { type: "string", example: "SecurePass123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            headers: {
              "Set-Cookie": {
                schema: { type: "string" },
                description: "Sets access_token and refresh_token httpOnly cookies",
              },
            },
          },
          401: { description: "Invalid email or password" },
          403: { description: "Google account or unverified email" },
          422: { description: "Validation errors" },
          ...serverError,
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Refresh auth cookies using refresh token cookie",
        tags: ["Auth"],
        responses: {
          200: { description: "Token refreshed successfully" },
          401: { description: "No refresh token provided" },
          403: { description: "Invalid refresh token" },
          ...serverError,
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Logout current user and clear cookies",
        tags: ["Auth"],
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Logged out successfully" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current logged-in user and profile",
        tags: ["Auth"],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Current user and profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/UserResponse" },
                  },
                },
              },
            },
          },
          ...authResponses,
          404: { description: "User not found" },
          ...serverError,
        },
      },
    },
    "/auth/profile": {
      patch: {
        summary: "Update the current user's patient or doctor profile",
        tags: ["Auth"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProfileUpdateRequest" },
              examples: {
                patient: {
                  value: {
                    first_name: "Jane",
                    last_name: "Moyo",
                    phone: "+263771000001",
                    date_of_birth: "1995-04-12",
                    gender: "female",
                    nhs_number: "HAMS-PT-001",
                    address: {
                      line1: "12 Willow Street",
                      city: "London",
                      postcode: "SW1A 1AA",
                    },
                    profile_image: "https://example.com/jane.jpg",
                  },
                },
                doctor: {
                  value: {
                    first_name: "Alan",
                    last_name: "Carter",
                    phone: "+263772000001",
                    specialisation: "General Practitioner",
                    license_number: "HAMS-DOC-001",
                    experience_years: 12,
                    fee: 45,
                    education: "MBChB, University of Zimbabwe",
                    bio: "Primary care doctor.",
                    avatar: "https://example.com/doctor.jpg",
                    availability_types: ["Online Consultation", "In-Person"],
                    clinic_name: "HAMS Central Clinic",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/UserResponse" },
                    profile: {
                      oneOf: [
                        { $ref: "#/components/schemas/PatientProfile" },
                        { $ref: "#/components/schemas/DoctorProfile" },
                      ],
                    },
                  },
                },
              },
            },
          },
          400: { description: "No editable profile fields provided" },
          409: { description: "Email or license number already in use" },
          422: { description: "Validation errors" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/auth/verify-email": {
      get: {
        summary: "Verify email address",
        tags: ["Auth"],
        parameters: [
          { in: "query", name: "token", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Email verified successfully" },
          400: { description: "Invalid or expired token" },
          ...serverError,
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        summary: "Resend verification email",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Verification link sent if email exists" },
          422: { description: "Validation errors" },
          ...serverError,
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        summary: "Request a password reset email",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Reset link sent if email exists" },
          422: { description: "Validation errors" },
          ...serverError,
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Reset password using email token",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: { type: "string" },
                  password: { type: "string", example: "NewSecurePass123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successful" },
          400: { description: "Invalid or expired reset token" },
          422: { description: "Validation errors" },
          ...serverError,
        },
      },
    },
    "/auth/google": {
      get: {
        summary: "Start Google OAuth login",
        tags: ["Auth"],
        responses: {
          302: { description: "Redirects to Google OAuth" },
        },
      },
    },
    "/auth/google/callback": {
      get: {
        summary: "Google OAuth callback",
        tags: ["Auth"],
        parameters: [
          { in: "query", name: "code", schema: { type: "string" } },
        ],
        responses: {
          302: { description: "Redirects to dashboard or login error page" },
        },
      },
    },
    "/doctors": {
      get: {
        summary: "List doctors",
        tags: ["Doctors"],
        security: [{ cookieAuth: [] }],
        parameters: [
          ...paginationParameters,
          { in: "query", name: "specialisation", schema: { type: "string" } },
          { in: "query", name: "search", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Doctors returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    doctors: {
                      type: "array",
                      items: { $ref: "#/components/schemas/DoctorProfile" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/doctors/specialisations": {
      get: {
        summary: "List doctor specialisations",
        tags: ["Doctors"],
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Specialisations returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    specialisations: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/doctors/{id}": {
      get: {
        summary: "Get a doctor with recent reviews",
        tags: ["Doctors"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Doctor returned" },
          404: { description: "Doctor not found" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/doctors/{id}/slots": {
      get: {
        summary: "Get available slots for a doctor",
        tags: ["Doctors", "Slots"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
          ...paginationParameters,
          { in: "query", name: "date", schema: { type: "string", format: "date" } },
          { in: "query", name: "type", schema: { type: "string", enum: ["online", "offline"] } },
        ],
        responses: {
          200: {
            description: "Slots returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    slots: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AvailabilitySlot" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/doctors/profile": {
      patch: {
        summary: "Update the logged-in doctor's profile",
        tags: ["Doctors"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  phone: { type: "string" },
                  experience_years: { type: "number" },
                  fee: { type: "number" },
                  education: { type: "string" },
                  certificate: { type: "string" },
                  bio: { type: "string" },
                  avatar: { type: "string" },
                  availability_types: {
                    type: "array",
                    items: { type: "string", enum: ["Online Consultation", "In-Person"] },
                  },
                  clinic_name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile updated successfully" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/slots": {
      post: {
        summary: "Create one or many availability slots",
        tags: ["Slots"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["start_time", "end_time"],
                properties: {
                  slot_date: { type: "string", format: "date", example: "2026-05-20" },
                  slot_dates: {
                    type: "array",
                    items: { type: "string", format: "date" },
                    example: ["2026-05-20", "2026-05-27"],
                  },
                  start_time: { type: "string", example: "09:00" },
                  end_time: { type: "string", example: "09:30" },
                  consultation_type: { type: "string", enum: ["online", "offline"] },
                  location: { type: "string", example: "Main Clinic" },
                  fee: { type: "number", example: 50 },
                  repeat: { $ref: "#/components/schemas/Repeat" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Slot or slots created successfully" },
          400: { description: "Invalid repeat or date data" },
          422: { description: "Validation errors" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/slots/{doctorId}": {
      get: {
        summary: "Get available slots for a doctor",
        tags: ["Slots"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "doctorId", required: true, schema: { type: "string" } },
          ...paginationParameters,
          { in: "query", name: "date", schema: { type: "string", format: "date" } },
          { in: "query", name: "type", schema: { type: "string", enum: ["online", "offline"] } },
        ],
        responses: {
          200: { description: "Slots returned" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/slots/{id}": {
      delete: {
        summary: "Delete an unbooked slot owned by the doctor",
        tags: ["Slots"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Slot deleted successfully" },
          400: { description: "Cannot delete booked slot" },
          404: { description: "Slot not found" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/appointments": {
      post: {
        summary: "Book a single or recurring appointment",
        tags: ["Appointments"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["slot_id"],
                properties: {
                  slot_id: { type: "string" },
                  type: { type: "string", enum: ["in-person", "video"] },
                  notes: { type: "string" },
                  repeat: {
                    type: "object",
                    properties: {
                      frequency: { type: "string", enum: ["none", "weekly", "monthly"] },
                      count: { type: "integer", minimum: 1, maximum: 60 },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Appointment booked successfully" },
          400: { description: "Invalid repeat data" },
          409: { description: "Slot not found or unavailable" },
          422: { description: "Validation errors" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/appointments/me": {
      get: {
        summary: "Get current user's appointments",
        tags: ["Appointments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          ...paginationParameters,
          {
            in: "query",
            name: "timeframe",
            schema: { type: "string", enum: ["past", "upcoming"] },
          },
        ],
        responses: {
          200: {
            description: "Appointments returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    appointments: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Appointment" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/appointments/{id}/cancel": {
      patch: {
        summary: "Cancel an appointment",
        tags: ["Appointments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reason: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Appointment cancelled successfully" },
          400: { description: "Appointment cannot be cancelled" },
          404: { description: "Appointment not found" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/appointments/{id}/reschedule": {
      patch: {
        summary: "Reschedule an appointment to another slot with the same doctor",
        tags: ["Appointments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["new_slot_id"],
                properties: { new_slot_id: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Appointment rescheduled successfully" },
          400: { description: "Invalid reschedule request" },
          404: { description: "Appointment not found" },
          409: { description: "New slot unavailable" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/appointments/{id}/complete": {
      patch: {
        summary: "Complete an appointment and create EHR record",
        tags: ["Appointments"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["diagnosis"],
                properties: {
                  diagnosis: { type: "string" },
                  notes: { type: "string" },
                  prescriptions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        medication: { type: "string" },
                        dosage: { type: "string" },
                        frequency: { type: "string" },
                        duration: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Appointment completed and EHR record created" },
          400: { description: "Appointment cannot be completed" },
          404: { description: "Appointment not found" },
          422: { description: "Validation errors" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/reviews": {
      post: {
        summary: "Submit a review for a completed appointment",
        tags: ["Reviews"],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["appointment_id", "rating"],
                properties: {
                  appointment_id: { type: "string" },
                  rating: { type: "integer", minimum: 1, maximum: 5 },
                  comment: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Review submitted successfully" },
          400: { description: "Invalid review request" },
          403: { description: "Not allowed to review appointment" },
          404: { description: "Appointment not found" },
          422: { description: "Validation errors" },
          ...authResponses,
          ...serverError,
        },
      },
    },
    "/reviews/doctor/{doctorId}": {
      get: {
        summary: "Get reviews for a doctor",
        tags: ["Reviews"],
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: "path", name: "doctorId", required: true, schema: { type: "string" } },
          ...paginationParameters,
        ],
        responses: {
          200: {
            description: "Reviews returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reviews: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Review" },
                    },
                    pagination: { $ref: "#/components/schemas/Pagination" },
                  },
                },
              },
            },
          },
          ...authResponses,
          ...serverError,
        },
      },
    },
  },
};

module.exports = { swaggerUi, swaggerDocument };
