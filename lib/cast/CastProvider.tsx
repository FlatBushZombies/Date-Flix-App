import React from "react"
import { CastReactContext, UNAVAILABLE_VALUE } from "./context"

export { useCast } from "./context"

// This bare file is a type-checking fallback only — Metro always prefers
// CastProvider.native.tsx (iOS/Android) or CastProvider.web.tsx over it, so
// this never actually runs in a built app. It exists because plain `tsc`
// (unlike Metro) doesn't resolve platform-suffixed files, and would
// otherwise report "Cannot find module" for every `@/lib/cast/CastProvider`
// import. Kept dependency-free (same shape as the web stub) so it's safe
// even in the unlikely case some non-Metro tool does load it.
export function CastProvider({ children }: { children: React.ReactNode }) {
  return <CastReactContext.Provider value={UNAVAILABLE_VALUE}>{children}</CastReactContext.Provider>
}
