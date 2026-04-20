import { Avoid, Duration, Era, Genre, Occasion, PlannerState, StreamingPlatform, Vibe } from '@/types/planner';

// Input validation utilities
export class InputValidator {
  static sanitizeString(input: string, maxLength: number = 500): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
      .trim()
      .slice(0, maxLength);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validateGenres(genres: string[]): boolean {
    if (!Array.isArray(genres)) return false;
    if (genres.length === 0 || genres.length > 10) return false;

    const validGenres: Genre[] = [
      'romance', 'thriller', 'comedy', 'drama', 'action',
      'horror', 'sci-fi', 'documentary'
    ];

    return genres.every(genre => validGenres.includes(genre as Genre));
  }

  static validateStreamingPlatforms(platforms: string[]): boolean {
    if (!Array.isArray(platforms)) return false;
    if (platforms.length > 20) return false;

    const validPlatforms: StreamingPlatform[] = [
      'Netflix', 'Disney+', 'Prime Video', 'Apple TV+', 'Max',
      'Hulu', 'Paramount+', 'Mubi'
    ];

    return platforms.every(platform => validPlatforms.includes(platform as StreamingPlatform));
  }

  static validateVibe(vibe: string | null): boolean {
    if (vibe === null) return true;

    const validVibes: Vibe[] = [
      'cozy', 'excited', 'emotional', 'chill', 'laugh', 'surprised'
    ];

    return validVibes.includes(vibe as Vibe);
  }

  static validateDuration(duration: string | null): boolean {
    if (duration === null) return true;

    const validDurations: Duration[] = ['short', 'medium', 'long', 'any'];
    return validDurations.includes(duration as Duration);
  }

  static validateEra(era: string | null): boolean {
    if (era === null) return true;

    const validEras: Era[] = [
      'new releases', 'classics', 'hidden gems', 'award winners'
    ];

    return validEras.includes(era as Era);
  }

  static validateAvoid(avoid: string[]): boolean {
    if (!Array.isArray(avoid)) return false;
    if (avoid.length > 10) return false;

    const validAvoid: Avoid[] = [
      'no sad endings', 'no gore', 'no kids films', 'no sequels'
    ];

    return avoid.every(item => validAvoid.includes(item as Avoid));
  }

  static validateOccasion(occasion: string | null): boolean {
    if (occasion === null) return true;

    const validOccasions: Occasion[] = [
      'date night', 'lazy Sunday', 'anniversary', 'Friday night'
    ];

    return validOccasions.includes(occasion as Occasion);
  }

  static validatePlannerState(state: PlannerState): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateGenres(state.genres)) {
      errors.push('Invalid genres selection');
    }

    if (!this.validateStreamingPlatforms(state.streaming)) {
      errors.push('Invalid streaming platforms');
    }

    if (!this.validateVibe(state.vibe)) {
      errors.push('Invalid vibe selection');
    }

    if (!this.validateDuration(state.duration)) {
      errors.push('Invalid duration selection');
    }

    if (!this.validateEra(state.era)) {
      errors.push('Invalid era selection');
    }

    if (!this.validateAvoid(state.avoid)) {
      errors.push('Invalid avoid preferences');
    }

    if (!this.validateOccasion(state.occasion)) {
      errors.push('Invalid occasion selection');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizePlannerState(state: PlannerState): PlannerState {
    return {
      genres: state.genres.filter(genre => this.validateGenres([genre])).slice(0, 10),
      streaming: state.streaming.filter(platform => this.validateStreamingPlatforms([platform])).slice(0, 20),
      anyStreaming: state.anyStreaming,
      vibe: this.validateVibe(state.vibe) ? state.vibe : null,
      duration: this.validateDuration(state.duration) ? state.duration : null,
      era: this.validateEra(state.era) ? state.era : null,
      avoid: state.avoid.filter(item => this.validateAvoid([item])).slice(0, 10),
      occasion: this.validateOccasion(state.occasion) ? state.occasion : null,
    };
  }
}