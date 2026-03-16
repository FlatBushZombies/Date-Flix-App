import { StreamingPlatform } from '../types/planner';

export interface StreamingConfig {
  name: StreamingPlatform;
  color: string;
  bgColor: string;
  icon: string;
  subtitle: string;
  searchUrl: string;
}

export const STREAMING_PLATFORMS: StreamingConfig[] = [
  {
    name: 'Netflix',
    color: '#E50914',
    bgColor: '#1a0505',
    icon: '🎬',
    subtitle: 'Movies & Series',
    searchUrl: 'https://www.netflix.com/search?q=',
  },
  {
    name: 'Disney+',
    color: '#1133b4',
    bgColor: '#05091a',
    icon: '✨',
    subtitle: 'Marvel, Star Wars',
    searchUrl: 'https://www.disneyplus.com/search/',
  },
  {
    name: 'Prime Video',
    color: '#00A8E1',
    bgColor: '#00111a',
    icon: '📦',
    subtitle: 'Amazon Originals',
    searchUrl: 'https://www.amazon.com/s?k=',
  },
  {
    name: 'Apple TV+',
    color: '#888888',
    bgColor: '#111111',
    icon: '🍎',
    subtitle: 'Award winners',
    searchUrl: 'https://tv.apple.com/search?term=',
  },
  {
    name: 'Max',
    color: '#5822C0',
    bgColor: '#100520',
    icon: '👑',
    subtitle: 'HBO Originals',
    searchUrl: 'https://www.max.com/search?q=',
  },
  {
    name: 'Hulu',
    color: '#1CE783',
    bgColor: '#021a0e',
    icon: '📺',
    subtitle: 'Next-day TV',
    searchUrl: 'https://www.hulu.com/search?q=',
  },
  {
    name: 'Paramount+',
    color: '#0064FF',
    bgColor: '#00051a',
    icon: '⭐',
    subtitle: 'CBS, MTV, BET',
    searchUrl: 'https://www.paramountplus.com/search/',
  },
  {
    name: 'Mubi',
    color: '#FF6B35',
    bgColor: '#1a0a05',
    icon: '🎨',
    subtitle: 'Arthouse & indie',
    searchUrl: 'https://mubi.com/search/',
  },
];

export function getStreamingConfig(name: string): StreamingConfig | undefined {
  return STREAMING_PLATFORMS.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

export function getWatchUrl(streaming: string, title: string): string {
  const config = getStreamingConfig(streaming);
  if (config) return config.searchUrl + encodeURIComponent(title);
  return `https://www.google.com/search?q=${encodeURIComponent(title + ' watch online')}`;
}
