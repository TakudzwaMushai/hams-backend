const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://medi-care-healthcare.netlify.app",
];

const getAllowedOrigins = () => {
  const configuredOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((origins) => origins.split(","))
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins])];
};

const corsOrigin = (origin, callback) => {
  const allowedOrigins = getAllowedOrigins();

  if (!origin || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS origin not allowed: ${origin}`));
};

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
};

module.exports = {
  corsOptions,
  getAllowedOrigins,
};
