const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'HAMS API',
    description: 'Healthcare Appointment Management System API',
    version: '1.0.0'
  },
  servers: [
    {
      url: 'https://hams-backend.vercel.app/api',
      description: 'Production'
    },
    {
      url: 'http://localhost:5000/api',
      description: 'Local'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      UserResponse: {
        type: 'object',
        properties: {
          id:         { type: 'string' },
          email:      { type: 'string' },
          role:       { type: 'string' },
          last_login: { type: 'string' },
          created_at: { type: 'string' }
        }
      },
      PatientProfile: {
        type: 'object',
        properties: {
          _id:           { type: 'string' },
          first_name:    { type: 'string' },
          last_name:     { type: 'string' },
          email:         { type: 'string' },
          phone:         { type: 'string' },
          date_of_birth: { type: 'string', format: 'date' },
          gender:        { type: 'string', enum: ['male', 'female', 'other'] },
          nhs_number:    { type: 'string' },
          address: {
            type: 'object',
            properties: {
              line1:    { type: 'string' },
              city:     { type: 'string' },
              postcode: { type: 'string' }
            }
          }
        }
      },
      DoctorProfile: {
        type: 'object',
        properties: {
          _id:            { type: 'string' },
          first_name:     { type: 'string' },
          last_name:      { type: 'string' },
          email:          { type: 'string' },
          phone:          { type: 'string' },
          specialisation: { type: 'string' },
          license_number: { type: 'string' },
          is_active:      { type: 'boolean' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/auth/signup': {
      post: {
        summary: 'Register a new patient or doctor',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'role', 'first_name', 'last_name'],
                properties: {
                  email:          { type: 'string', example: 'jane@example.com' },
                  password:       { type: 'string', example: 'SecurePass123' },
                  role:           { type: 'string', enum: ['patient', 'doctor'] },
                  first_name:     { type: 'string', example: 'Jane' },
                  last_name:      { type: 'string', example: 'Smith' },
                  phone:          { type: 'string', example: '+44 7700 900001' },
                  date_of_birth:  { type: 'string', format: 'date', example: '1992-03-22' },
                  gender:         { type: 'string', enum: ['male', 'female', 'other'] },
                  nhs_number:     { type: 'string', example: '485 777 3457' },
                  specialisation: { type: 'string', example: 'General Practitioner' },
                  license_number: { type: 'string', example: 'GMC-1234567' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Account created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    token:   { type: 'string' },
                    user:    { $ref: '#/components/schemas/UserResponse' }
                  }
                }
              }
            }
          },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { description: 'Validation errors',        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Server error',             content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/auth/login': {
      post: {
        summary: 'Login as a patient or doctor',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', example: 'jane@example.com' },
                  password: { type: 'string', example: 'SecurePass123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    token:   { type: 'string' },
                    user: {
                      allOf: [
                        { $ref: '#/components/schemas/UserResponse' },
                        {
                          type: 'object',
                          properties: {
                            profile: {
                              oneOf: [
                                { $ref: '#/components/schemas/PatientProfile' },
                                { $ref: '#/components/schemas/DoctorProfile' }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { description: 'Validation errors',         content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Server error',              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/auth/logout': {
      post: {
        summary: 'Logout current user',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully',  content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Not authenticated',        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/auth/me': {
      get: {
        summary: 'Get current logged-in user and profile',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user and profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user:    { $ref: '#/components/schemas/UserResponse' },
                    profile: {
                      oneOf: [
                        { $ref: '#/components/schemas/PatientProfile' },
                        { $ref: '#/components/schemas/DoctorProfile' }
                      ]
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'User not found',    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Server error',      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/auth/forgot-password': {
      post: {
        summary: 'Request a password reset email',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', example: 'jane@example.com' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Reset link sent if email exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { description: 'Validation errors',               content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Server error',                    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/auth/reset-password': {
      post: {
        summary: 'Reset password using token from email',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token:    { type: 'string', example: 'abc123resettoken' },
                  password: { type: 'string', example: 'NewSecurePass123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Password reset successful',      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          400: { description: 'Invalid or expired reset token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { description: 'Validation errors',              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Server error',                   content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    }
  }
};

module.exports = { swaggerUi, swaggerDocument };