const { withAndroidManifest } = require("expo/config-plugins")

// Android 11+ (API 30) restricts cross-app package visibility. Without
// declaring these schemes under <queries>, Linking.canOpenURL() silently
// returns false for every streaming app scheme even when it's actually
// installed — which breaks "Watch on TV" / Cast & TV detection on Android
// (see lib/tvCast.ts APP_SCHEMES, used by app/account-settings.tsx). iOS has
// its own equivalent already declared in app.json's
// ios.infoPlist.LSApplicationQueriesSchemes.
const SCHEMES = [
  "nflx",
  "disneyplus",
  "aiv",
  "videos",
  "hbomax",
  "hulu",
  "peacock",
  "paramountplus",
  "mubi",
]

module.exports = function withCastableAppQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest

    if (!manifest.queries) manifest.queries = [{}]
    const queries = manifest.queries[0]
    if (!queries.intent) queries.intent = []

    for (const scheme of SCHEMES) {
      const alreadyDeclared = queries.intent.some(
        (entry) => entry?.data?.[0]?.$?.["android:scheme"] === scheme,
      )
      if (alreadyDeclared) continue

      queries.intent.push({
        action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
        data: [{ $: { "android:scheme": scheme } }],
      })
    }

    return config
  })
}
