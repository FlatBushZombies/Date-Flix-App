export type Genre =
  | 'romance'
  | 'thriller'
  | 'comedy'
  | 'drama'
  | 'action'
  | 'horror'
  | 'sci-fi'
  | 'documentary';

export type Vibe =
  | 'cozy'
  | 'excited'
  | 'emotional'
  | 'chill'
  | 'laugh'
  | 'surprised';

export type Duration = 'short' | 'medium' | 'long' | 'any';

export type Era =
  | 'new releases'
  | 'classics'
  | 'hidden gems'
  | 'award winners';

export type Avoid =
  | 'no sad endings'
  | 'no gore'
  | 'no kids films'
  | 'no sequels';

export type Occasion =
  | 'date night'
  | 'lazy Sunday'
  | 'anniversary'
  | 'Friday night';

export type StreamingPlatform =
  | 'Netflix'
  | 'Disney+'
  | 'Prime Video'
  | 'Apple TV+'
  | 'Max'
  | 'Hulu'
  | 'Paramount+'
  | 'Mubi';

export interface PlannerState {
  genres: Genre[];
  streaming: StreamingPlatform[];
  anyStreaming: boolean;
  vibe: Vibe | null;
  duration: Duration | null;
  era: Era | null;
  avoid: Avoid[];
  occasion: Occasion | null;
}

export interface MovieResult {
  title: string;
  year: number;
  genre: string;
  duration: string;
  rating: string;
  reason: string;
  streaming: string;
  topPick: boolean;
}

export interface MovieNightPlan {
  movies: MovieResult[];
  snack: string;
  ambiance: string;
  summary: string;
}
