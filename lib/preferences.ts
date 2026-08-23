import AsyncStorage from "@react-native-async-storage/async-storage"

// Local, per-device preferences that don't need a server round-trip.
// Push notifications themselves are toggled by registering/clearing the
// device's push token (see utils/notifications.ts) — this only covers the
// preferences that are purely about how the app behaves locally.
export interface LocalPreferences {
  // Mutes the in-app "streak" / "streak broken" toast banners that fire when
  // your partner's activity changes something on your screen. Doesn't affect
  // server-sent push notifications — see pushEnabled for that.
  partnerActivityMuted: boolean
  pushEnabled: boolean
}

const KEY = "@local_preferences"

const DEFAULTS: LocalPreferences = {
  partnerActivityMuted: false,
  pushEnabled: true,
}

export async function getPreferences(): Promise<LocalPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

export async function setPreferences(patch: Partial<LocalPreferences>): Promise<LocalPreferences> {
  const current = await getPreferences()
  const next = { ...current, ...patch }
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // best-effort — the in-memory value the caller holds is still correct
    // for this session even if persistence failed
  }
  return next
}
