const { swaggerDocument } = require("../../../swagger/swagger");

describe("Swagger documentation", () => {
  it("documents every registered route", () => {
    const expectedOperations = [
      "post /auth/signup",
      "post /auth/login",
      "post /auth/refresh",
      "post /auth/logout",
      "get /auth/me",
      "patch /auth/profile",
      "get /auth/verify-email",
      "post /auth/resend-verification",
      "post /auth/forgot-password",
      "post /auth/reset-password",
      "get /auth/google",
      "get /auth/google/callback",
      "get /doctors",
      "get /doctors/specialisations",
      "get /doctors/{id}",
      "get /doctors/{id}/slots",
      "patch /doctors/profile",
      "post /slots",
      "get /slots/{doctorId}",
      "delete /slots/{id}",
      "post /appointments",
      "get /appointments/me",
      "patch /appointments/{id}/cancel",
      "patch /appointments/{id}/reschedule",
      "patch /appointments/{id}/complete",
      "post /reviews",
      "get /reviews/doctor/{doctorId}",
    ];

    for (const operation of expectedOperations) {
      const [method, path] = operation.split(" ");
      expect(swaggerDocument.paths[path]?.[method]).toBeDefined();
    }
  });

  it("documents cookie auth and pagination", () => {
    expect(swaggerDocument.components.securitySchemes.cookieAuth).toEqual(
      expect.objectContaining({ in: "cookie", name: "access_token" }),
    );
    expect(swaggerDocument.components.schemas.Pagination.properties).toEqual(
      expect.objectContaining({
        totalItems: expect.any(Object),
        currentPage: expect.any(Object),
        pageSize: expect.any(Object),
        totalPages: expect.any(Object),
      }),
    );
  });
});
