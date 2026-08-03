import { getTenantFromAuthHeader } from "../auth/service.js";
import { handleRouteError } from "../routes/helpers.js";

/**
 * Attach tenant context:
 *   req.hiringManager, req.organization, req.membership,
 *   req.userId, req.orgId, req.role, req.tenant
 */
export function requireAuth(req, res, next) {
  try {
    const tenant = getTenantFromAuthHeader(req.headers.authorization);
    req.hiringManager = tenant.hiringManager;
    req.organization = tenant.organization;
    req.membership = tenant.membership;
    req.userId = tenant.userId;
    req.orgId = tenant.orgId;
    req.role = tenant.role;
    req.tenant = tenant;
    next();
  } catch (err) {
    return handleRouteError(res, err);
  }
}
