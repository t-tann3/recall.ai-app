/** Shared handle so routes can read webhook idempotency state. */
let persistence = null;

export function setPersistence(instance) {
  persistence = instance;
}

export function getPersistence() {
  return persistence;
}
