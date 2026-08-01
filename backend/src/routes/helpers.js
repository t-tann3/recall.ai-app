export function notImplemented(res, feature) {
  return res.status(501).json({
    ok: false,
    error: "not_implemented",
    feature,
    message: `${feature} is scaffolded but not implemented yet`,
  });
}

export function handleRouteError(res, err) {
  const status = err.status || 500;
  return res.status(status).json({
    ok: false,
    error: status === 500 ? "internal_error" : "request_error",
    message: err.message || "Unexpected error",
  });
}
