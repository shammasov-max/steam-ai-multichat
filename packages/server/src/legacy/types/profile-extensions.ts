import { EventEmitter } from 'events';

// JWT token structure
export type JwtToken = {
  readonly refreshToken: string;
  readonly exp: number;
  readonly rt_exp?: number;
  readonly password: string;
};

// Login result type
export type LoginResult = {
  readonly status: boolean;
  readonly refreshToken?: string;
  readonly jwt?: any;
};

// Extended SteamUser interface to include custom methods
declare module 'steam-user' {
  interface SteamUser {
    _readFile(filename: string): Promise<Buffer>;
    _saveFile(filename: string, data: Buffer): void;
  }
  
  // Extend Events interface to include missing events
  interface Events {
    friendPersonasLoaded: () => void;
    friendTyping: (steamId: string) => void;
    friendMessage: (messageData: any) => void;
  }
}

// Profile prototype extensions  

// Global process extensions
declare global {
  namespace NodeJS {
    interface Process {
      settings: {
        language: string;
        auto_boost: boolean;
        wall_spam_messages: string[];
        dearest_item_language: string;
      };
      languages: Record<string, Record<string, string>>;
      helper: {
        print_info(message: string, color?: string, url?: string | boolean, account?: string | boolean): void;
        replace_log_variable(template: string, variables: any[]): string;
        notificate(title: string, message: string, data: any): void;
        getInvites(profile: any, types: number[]): any[];
        random(max: number): number;
        replaceTemplateDomains(message: string, templates: any): string;
      };
      steamTimeOffset: number;
      clients: Record<string, any>;
      current_account_index: number;
      accounts: any[];
      domainTemplates: any;
      prices: Record<string, Record<string, { price: number }>>;
    }
  }
  
  interface Window {
    swal(title: string, message: string, type: string): void;
  }
}
