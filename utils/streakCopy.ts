// Central copy for streak notifications + toasts, so wording stays in sync across surfaces.

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const

const MILESTONE_FLAVOR: Record<number, string> = {
  3: "Three days in a row — you're building a habit!",
  7: "One whole week of movie nights together!",
  14: "Two weeks strong. This is becoming a tradition.",
  30: "A month strong — you two are unstoppable.",
  60: "60 days. That's a lot of movie nights.",
  100: "100 days! Certified movie soulmates.",
}

export function streakStartedCopy(partnerName: string) {
  return {
    title: "🔥 Streak Started!",
    body: `You and ${partnerName} both swiped today. Keep it up tomorrow!`,
  }
}

export function streakIncrementCopy(day: number, partnerName: string) {
  return {
    title: `🔥 Day ${day} Streak!`,
    body: `You and ${partnerName} both swiped today. Keep it going!`,
  }
}

export function streakMilestoneCopy(day: number, partnerName: string) {
  const flavor = MILESTONE_FLAVOR[day] ?? `${day} days and counting. Incredible!`
  return {
    title: `🎉 ${day}-Day Streak!`,
    body: flavor,
  }
}

export function streakBrokenCopy(previousStreak: number, partnerName: string) {
  return {
    title: "Streak Ended 💔",
    body: `Your ${previousStreak}-day streak with ${partnerName} came to an end. Swipe today to start a new one!`,
  }
}

export function streakFrozenCopy(day: number, partnerName: string) {
  return {
    title: "🧊 Streak Saved!",
    body: `You and ${partnerName} missed a day, but your free monthly Streak Freeze covered it. Your ${day}-day streak is still alive!`,
  }
}

export function streakEventCopy(
  event: "increment" | "milestone" | "broken" | "frozen",
  day: number,
  partnerName: string,
) {
  if (event === "broken") return streakBrokenCopy(day, partnerName)
  if (event === "frozen") return streakFrozenCopy(day, partnerName)
  if (event === "milestone") return streakMilestoneCopy(day, partnerName)
  return day === 1 ? streakStartedCopy(partnerName) : streakIncrementCopy(day, partnerName)
}
