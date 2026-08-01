import { getHiringManagerFromAuthHeader } from "../auth/service.js";
import { handleRouteError } from "../routes/helpers.js";

/** Attach req.hiringManager when Authorization: Bearer <token> is valid. */
export function requireAuth(req, res, next) {
  try {
    req.hiringManager = getHiringManagerFromAuthHeader(req.headers.authorization);
    next();
  } catch (err) {
    return handleRouteError(res, err);
  }
}
