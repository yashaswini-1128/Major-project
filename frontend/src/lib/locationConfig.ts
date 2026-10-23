// ─── Allowed Exam Location ────────────────────────────────────────────────────
// Dr Chandramma Dayananda Sagar Institute of Medical Education and Research
// DEVARAKAGGALAHALLI, HAROHALLI, Kanakapura Main Rd, Kanakapura, Karnataka 562112
export const ALLOWED_LOCATION = {
  lat: 12.6610841,
  lng: 77.4494629,
  /** Allowed radius in meters. Students must be within this distance. */
  radiusMeters: 300,
}

/**
 * Calculates the straight-line distance (in metres) between two GPS coordinates
 * using the Haversine formula.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6_371_000 // Earth's radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Returns true if the given coordinates are within the allowed exam area.
 */
export function isWithinAllowedArea(lat: number, lng: number): boolean {
  const dist = haversineDistance(lat, lng, ALLOWED_LOCATION.lat, ALLOWED_LOCATION.lng)
  return dist <= ALLOWED_LOCATION.radiusMeters
}
