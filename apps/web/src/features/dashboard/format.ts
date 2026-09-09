/** Format a duration in seconds as "Xd Yh Zm". */
export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  return `${days}d ${hours}h ${minutes}m`
}

/**
 * Map optical RX power (dBm, typical usable range -8..-28) to a 0-100 signal
 * scale: -8 dBm = 100%, -28 dBm = 0%.
 */
export const rxPowerToSignal = (rxPower: number): number => {
  if (!rxPower) {
    return 0
  }
  return Math.max(0, Math.min(100, Math.round(((rxPower + 28) / 20) * 100)))
}
