import { getPreferences, setPreferences } from "./preferences"

// Thrown by any AI call site before it transmits data, when the user hasn't
// granted aiDataConsent yet. Callers catch this by message (not instanceof —
// it crosses the utils/ai-service.ts try/catch which normalizes to a plain
// Error) and show a consent prompt instead of a generic error.
export const AI_CONSENT_REQUIRED = "AI_CONSENT_REQUIRED"

export async function hasAIConsent(): Promise<boolean> {
  const prefs = await getPreferences()
  return prefs.aiDataConsent
}

export async function setAIConsent(granted: boolean): Promise<void> {
  await setPreferences({ aiDataConsent: granted })
}

// Call this immediately before any request that sends user data to Gemini.
// Throwing here (rather than checking at the UI layer) makes it structurally
// impossible for a new call site to skip consent.
export async function assertAIConsent(): Promise<void> {
  if (!(await hasAIConsent())) {
    throw new Error(AI_CONSENT_REQUIRED)
  }
}

// Shared copy for the inline consent ask, handed to useConfirm()'s
// confirm.show(...) wherever an AI feature hits AI_CONSENT_REQUIRED outside
// onboarding. Names Gemini explicitly and never fires an AI request itself —
// `onAllow` runs only after the user has granted consent.
export function buildAIConsentPrompt(onAllow: () => void) {
  return {
    title: "Share preferences with Google Gemini?",
    message:
      "DateFlix sends the preferences you type — never your account or contacts — to Google Gemini to power this feature. You can turn this off anytime in Settings.",
    variant: "default" as const,
    buttons: [
      { label: "Not Now", style: "cancel" as const },
      {
        label: "Allow",
        style: "primary" as const,
        onPress: async () => {
          await setAIConsent(true)
          onAllow()
        },
      },
    ],
  }
}
