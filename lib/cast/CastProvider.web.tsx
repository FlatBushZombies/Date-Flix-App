import React from "react"
import { CastReactContext, UNAVAILABLE_VALUE } from "./context"

export { useCast } from "./context"

// react-native-google-cast has no web implementation and must never be
// imported here — Metro resolves this file (not CastProvider.native.tsx)
// for web builds, so casting is simply unavailable there.
export function CastProvider({ children }: { children: React.ReactNode }) {
  return <CastReactContext.Provider value={UNAVAILABLE_VALUE}>{children}</CastReactContext.Provider>
}
