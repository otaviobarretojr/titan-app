export type DeviceIdentity = { id: string; name: string }
const DEVICE_ID_KEY = 'titan-device-id'
const DEVICE_NAME_KEY = 'titan-device-name'

function randomId() {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
}

export function getDeviceIdentity(): DeviceIdentity {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = randomId()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  const name = localStorage.getItem(DEVICE_NAME_KEY) || `Dispositivo ${id.slice(0, 4)}`
  return { id, name }
}

export function updateDeviceName(name: string): DeviceIdentity {
  const current = getDeviceIdentity()
  const safeName = name.trim().slice(0, 40) || `Dispositivo ${current.id.slice(0, 4)}`
  localStorage.setItem(DEVICE_NAME_KEY, safeName)
  return { ...current, name: safeName }
}
