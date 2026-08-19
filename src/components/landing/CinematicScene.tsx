/**
 * Compatibility shim for the landing route.
 *
 * The previous cinematic scene was intentionally removed. Keeping this
 * zero-render component prevents stale route imports from breaking builds
 * while the landing route is migrated away from the cinematic layer.
 */
export function CinematicScene() {
  return null;
}
