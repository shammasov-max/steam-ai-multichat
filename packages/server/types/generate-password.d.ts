declare module 'generate-password' {
  export interface GenerateOptions {
    length?: number;
    numbers?: boolean;
    symbols?: boolean;
    lowercase?: boolean;
    uppercase?: boolean;
    excludeSimilarCharacters?: boolean;
    exclude?: string;
    strict?: boolean;
  }

  /**
   * Generate a password
   * @param options Password generation options
   * @returns Generated password string
   */
  export function generate(options?: GenerateOptions): string;

  /**
   * Generate multiple passwords
   * @param options Password generation options
   * @param count Number of passwords to generate
   * @returns Array of generated passwords
   */
  export function generateMultiple(options: GenerateOptions & { length: number }, count: number): string[];
}
