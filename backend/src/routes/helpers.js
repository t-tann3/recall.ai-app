/**
 * Stub response helper — replace handlers with real logic later.
 */
export function notImplemented(res, feature) {
  return res.status(501).json({
    ok: false,
    error: "not_implemented",
    feature,
    message: `${feature} is scaffolded but not implemented yet`,
  });
}
