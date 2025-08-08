import { env } from "@/shared/configs/environment";

/**
 * Parses the JWT expiration duration string and returns the number of seconds.
 *
 * The duration can be in the format of "1h", "30m", "15s", or "2d".
 * If no duration is provided, it defaults to the value from `env.JWT_EXPIRES_IN`.
 * If the value is invalid, it defaults to 24 hours (86400 seconds).
 *
 * @param {string} [duration] - The JWT expiration duration string.
 * @returns {number} The number of seconds until expiration.
 */
export const parseJwtExpiresIn = (duration?: string): number => {
  const expiresIn = duration || env.JWT_EXPIRES_IN;
  const unit = expiresIn.slice(-1).toLowerCase();
  const value = parseInt(expiresIn.slice(0, -1), 10);

  if (isNaN(value)) {
    return 24 * 60 * 60;
  }

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 24 * 60 * 60;
    default:
      const seconds = parseInt(expiresIn, 10);
      return isNaN(seconds) ? 24 * 60 * 60 : seconds;
  }
};
