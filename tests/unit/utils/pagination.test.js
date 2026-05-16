const {
  getPagination,
  getPaginationMeta,
} = require("../../../src/utils/pagination");

describe("pagination utility", () => {
  it("returns default pagination values", () => {
    expect(getPagination()).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("calculates skip from page and limit", () => {
    expect(getPagination({ page: "3", limit: "25" })).toEqual({
      page: 3,
      limit: 25,
      skip: 50,
    });
  });

  it("falls back for invalid query values", () => {
    expect(getPagination({ page: "0", limit: "bad" })).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it("caps limit at the configured maximum", () => {
    expect(getPagination({ page: "1", limit: "500" })).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
    });
  });

  it("builds frontend-compatible pagination metadata", () => {
    expect(getPaginationMeta({ totalItems: 42, page: 2, limit: 10 })).toEqual({
      total: 42,
      page: 2,
      limit: 10,
      total_pages: 5,
      totalItems: 42,
      currentPage: 2,
      pageSize: 10,
      totalPages: 5,
    });
  });
});
