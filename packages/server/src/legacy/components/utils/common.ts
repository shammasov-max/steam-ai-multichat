// Type definitions
export type Environment = 'development' | 'production';

export type TimeUnit = {
  readonly msInSecond: number;
  readonly msInMinute: number;
  readonly msInHour: number;
  readonly msInDay: number;
};

export type ServerError = {
  readonly userNotFound: string;
  readonly licenseExpired: string;
  readonly invalidPC: string;
  readonly somethingWentWrong: string;
  readonly serverError: string;
  readonly invalidResponse: string;
  readonly invalidRequest: string;
};

export type CommonConfig = {
  readonly isProduction: boolean;
  readonly domain: string;
  readonly serverErrors: ServerError;
  readonly webApiTokenRegex: RegExp;
} & TimeUnit;

// Environment detection
export const getEnvironment = (): Environment => 
  (process.env.NODE_ENV as Environment) || 'development';

export const isProduction = (): boolean => 
  getEnvironment() === 'production';

// Domain configuration
export const getDomain = (env: Environment): string =>
  env === 'production' ? 'https://inosoft.market' : 'https://localhost';

export const domain = (): string => getDomain(getEnvironment());

// Time units
export const msInSecond = 1000;
export const msInMinute = 60 * msInSecond;
export const msInHour = 60 * msInMinute;
export const msInDay = 24 * msInHour;

// Server errors
export const serverErrors: ServerError = {
  userNotFound: 'userNotFound',
  licenseExpired: 'licenseExpired',
  invalidPC: 'invalidPC',
  somethingWentWrong: 'somethingWentWrong',
  serverError: 'serverError',
  invalidResponse: 'invalidResponse',
  invalidRequest: 'invalidRequest'
};

// Web API token regex
export const webApiTokenRegex = /webapi_token&quot;:&quot;(.*)&quot;/;

// Main configuration
export const commonConfig: CommonConfig = {
  isProduction: isProduction(),
  domain: domain(),
  msInSecond,
  msInMinute,
  msInHour,
  msInDay,
  serverErrors,
  webApiTokenRegex
};
export default commonConfig;