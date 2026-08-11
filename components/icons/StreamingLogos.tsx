// Hand-drawn brand marks for streaming services — kept as real SVG logos
// rather than emoji, since these are the one place a literal brand identity
// matters. Shared between match.tsx and anywhere else that needs the same
// "where to watch" grid.
import { Circle, Path, Rect, Svg, Text as SvgText } from "react-native-svg"

export type StreamingIconProps = { size?: number }

export const NetflixIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 6.854.398-2.296-6.987-3.924-11.945-5.894-18.715l5.52 18.715h6.922L8.044 0H5.398zm8.2 0v9.03l4.34 11.58 4.32-11.58V0H13.6z"
      fill="white"
    />
    <Path
      d="M5.398 0v.006C3.108 6.577 1.166 12.092 0 17.587v6.01c1.854-.08 3.708-.174 5.404-.174V0H5.398z"
      fill="white"
    />
  </Svg>
)

export const PrimeVideoIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13.127 9.725l-.008.021c-.434 1.181-.898 2.354-1.395 3.514l2.854-.001c-.447-1.183-.948-2.358-1.451-3.534zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.952 16.691l-.635-1.778H8.39l-.65 1.784-2.007-.003 4.08-10.34 2.351-.002 4.437 10.339h-1.649z"
      fill="white"
    />
  </Svg>
)

export const DisneyPlusIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11.37 5.57c-.26-.04-.52-.06-.78-.06-3.34 0-6.04 2.7-6.04 6.04 0 2.84 1.96 5.22 4.6 5.86-.14-.63-.22-1.29-.22-1.96 0-4.28 2.62-7.89 6.16-9.53-.51-.19-1.05-.31-1.61-.35H11.37zm3.98-.23c-.06 0-.12.01-.18.01 2.35 1.58 3.91 4.24 3.91 7.26 0 1.41-.34 2.74-.93 3.92.24.02.49.03.74.03 3.34 0 6.04-2.7 6.04-6.04 0-2.74-1.83-5.07-4.34-5.82-.36-.1-.73-.17-1.12-.2-.37-.05-.74-.07-1.12-.07v-.09zm-5.88 6.21c0 4.59 2.11 8.39 4.89 8.88.24.04.48.06.73.06 3.65 0 6.61-3.98 6.61-8.88 0-.55-.04-1.08-.12-1.6-1.07 3.19-3.47 5.45-6.44 5.45-1.61 0-3.07-.6-4.17-1.59-.3-.26-.57-.56-.82-.88-.45-.63-.68-1.4-.68-2.44zm1.1-1.19c0 1.24.33 2.2.97 2.83.55.55 1.31.86 2.2.86 2.44 0 4.43-2.59 4.43-5.78 0-.34-.02-.67-.07-.99-1.51.9-2.61 2.58-2.61 4.52 0 .14.01.28.02.42-.36.08-.73.12-1.12.12-1.57 0-2.95-.72-3.82-1.98z"
      fill="white"
    />
  </Svg>
)

export const MaxIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6l3 12h2L6 9l3 9h2l3-9-2 9h2l3-12h-3l-2.5 8L10 6H7L4.5 14 3 6H3z"
      fill="white"
    />
  </Svg>
)

export const HuluIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 3v8.3c.8-.8 1.9-1.3 3.2-1.3 2.7 0 4.3 1.7 4.3 4.5V21h-3.5v-6c0-1.2-.6-1.9-1.7-1.9-1.1 0-1.8.8-1.8 1.9v6H3.5V3H6.5zm8 7.2h3.5V21H14.5V10.2z"
      fill="white"
    />
  </Svg>
)

export const AppleTVIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.37 2.73M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill="white"
    />
  </Svg>
)

export const PeacockIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 12 L12 3 Q12.5 7 16 8 Z" fill="#E8222C" />
    <Path d="M12 12 L16 8 Q18 11 17 14 Z" fill="#F5A623" />
    <Path d="M12 12 L17 14 Q15 17 12 17 Z" fill="#4CAF50" />
    <Path d="M12 12 L12 17 Q9 17 7 14 Z" fill="#2196F3" />
    <Path d="M12 12 L7 14 Q6 11 8 8 Z" fill="#9C27B0" />
    <Path d="M12 12 L8 8 Q11.5 7 12 3 Z" fill="#00BCD4" />
    <Circle cx="12" cy="12" r="2" fill="white" />
  </Svg>
)

export const ParamountIcon = ({ size = 28 }: StreamingIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L6.5 12H8.5L12 6.5L15.5 12H17.5L12 3Z" fill="white" />
    <Path d="M5 7.5 Q12 2 19 7.5" stroke="white" strokeWidth="0.4" fill="none" strokeDasharray="1 1.5" />
    <Rect x="4" y="13" width="16" height="1.5" rx="0.75" fill="white" />
    <Path d="M9 15.5 Q9 18.5 12 19.5 Q15 18.5 15 15.5" stroke="white" strokeWidth="0.8" fill="none" />
  </Svg>
)

// Fallback for any platform without a dedicated hand-drawn mark — a clean
// monogram rather than a generic/unbranded icon.
export function monogramIcon(letter: string) {
  return function MonogramIcon({ size = 28 }: StreamingIconProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <SvgText x="12" y="17" fontSize="14" fontWeight="700" fill="white" textAnchor="middle">
          {letter}
        </SvgText>
      </Svg>
    )
  }
}
