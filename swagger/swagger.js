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
      url: 'https://hams-backend.vercel.app',
      description: 'Production'
    },
    {
      url: 'http://localhost:5000',
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
          profile:    { type: 'object' }
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
          201: { description: 'Account created successfully' },
          409: { description: 'Email already registered' },
          422: { description: 'Validation errors' },
          500: { description: 'Server error' }
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
                    user:    { $ref: '#/components/schemas/UserResponse' }
                  }
                }
              }
            }
          },
          401: { description: 'Invalid email or password' },
          422: { description: 'Validation errors' },
          500: { description: 'Server error' }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Logout',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out successfully' },
          401: { description: 'Not authenticated' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current logged-in user',
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
                    user:    { type: 'object' },
                    profile: { type: 'object' }
                  }
                }
              }
            }
          },
          401: { description: 'Not authenticated' },
          500: { description: 'Server error' }
        }
      }
    }
  }
};

module.exports = { swaggerUi, swaggerDocument };