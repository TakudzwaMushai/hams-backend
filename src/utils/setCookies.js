const setTokenCookies = (res, { accessToken, refreshToken }) => {
  const isProd = process.env.NODE_ENV === "production";

  // Access token cookie — 15 minutes
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes in ms
    path: "/",
  });

  // Refresh token cookie — 7 days
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: "/", // only sent to refresh endpoint
  });
};

const clearTokenCookies = (res) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
};

module.exports = { setTokenCookies, clearTokenCookies };
