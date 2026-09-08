/** Daily Pre-Trip and Post-Trip columns — one list for portal + driver phone form. */

export const PRE_TRIP_CHECKS = [
  'Tyres & pressure (all + spare)',
  'Spare tyre, jack & tool kit',
  'Body / dents / damage',
  'Lights (head, tail, brake, indicator, reverse)',
  'Horn',
  'Mirrors, windshield & wipers',
  'Engine oil / coolant / brake fluid',
  'Brakes',
  'Seat belts',
  'Fuel / battery level',
  'Documents in vehicle (RC / Insurance / PUC)',
  'Fire extinguisher & first aid',
  'Vehicle cleanliness',
  'Driver fit to drive',
  'Opening KM recorded',
]

export const POST_TRIP_CHECKS = [
  'Closing KM recorded',
  'Fuel / battery after trip',
  'New damage or dents',
  'Tyres after trip',
  'Lights & indicators working',
  'Brakes after trip',
  'Windshield & mirrors clear',
  'Interior cleanliness',
  'Documents in vehicle (RC / Insurance / PUC)',
  'Fire extinguisher & first aid present',
  'Keys & vehicle secured',
  'Any incident during trip',
  'Vehicle parked safely',
  'Driver fit on return',
  'Client / escort complaint (if any)',
]

export const DIESEL_LEVELS = ['Full Tank', 'Half tank', 'less than half tank'] as const

export const FLEET_DRIVER_TRIP_URL = 'https://www.agilegroup-digital.co.in/fleet-trip'
export const FLEET_DRIVERS_REGISTER_URL = 'https://www.agilegroup-digital.co.in/fleet-drivers'

export function fleetTripBranchUrl(branch: string): string {
  const name = String(branch || '').trim()
  if (!name) return FLEET_DRIVER_TRIP_URL
  return `${FLEET_DRIVER_TRIP_URL}/${encodeURIComponent(name)}`
}
