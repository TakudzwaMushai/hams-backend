const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getPagination = (query = {}, options = {}) => {
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;

  const page = toPositiveInteger(query.page, DEFAULT_PAGE);
  const requestedLimit = toPositiveInteger(query.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const getPaginationMeta = ({ totalItems, page, limit }) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    total: totalItems,
    page,
    limit,
    total_pages: totalPages,
    totalItems,
    currentPage: page,
    pageSize: limit,
    totalPages,
  };
};

module.exports = {
  getPagination,
  getPaginationMeta,
};
