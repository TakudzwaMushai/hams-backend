const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
};
