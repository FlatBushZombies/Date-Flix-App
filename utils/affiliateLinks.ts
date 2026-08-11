// Affiliate/referral plumbing for the "where to watch" handoff in match.tsx.
//
// Most streaming services don't expose a simple query-param affiliate link —
// they run through media/affiliate networks (e.g. Impact.com, CJ, Rakuten)
// that issue their own wrapped tracking URLs once you're approved. Amazon's
// Associates program is the one exception with a documented `tag=` param, so
// it's wired up here; the rest are no-ops until real credentials exist.
//
// Nothing changes for the user — same buttons, same destinations — this only
// appends a tracking param when a real tag is configured via env var.

const AMAZON_ASSOCIATES_TAG = process.env.EXPO_PUBLIC_AMAZON_ASSOCIATES_TAG

export function withAffiliateTag(platformName: string, url: string): string {
  if (platformName === "Prime Video" && AMAZON_ASSOCIATES_TAG) {
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}tag=${encodeURIComponent(AMAZON_ASSOCIATES_TAG)}`
  }

  // Add another `if (platformName === "...")` block here once a platform's
  // affiliate network issues real tagged/wrapped links.
  return url
}
