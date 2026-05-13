const setTokenCookies = (res, { accessToken, refreshToken }) => {
  const isProd = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProd, // must be true in prod for sameSite: none
    sameSite: isProd ? "none" : "lax", // none required for cross-origin
    path: "/",
  };

  res.cookie("access_token", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refresh_token", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearTokenCookies = (res) => {
  const isProd = process.env.NODE_ENV === "production";

  // clearCookie options must EXACTLY match the options used when setting
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax", // must match setTokenCookies exactly
    path: "/",
  };

  res.clearCookie("access_token", cookieOptions);
  res.clearCookie("refresh_token", cookieOptions);
};

module.exports = { setTokenCookies, clearTokenCookies };
