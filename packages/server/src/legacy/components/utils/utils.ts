import machineUuid from 'machine-uuid';
import { arch, platform } from 'os';
import crypto from 'crypto';
import publicKey from "../../../recourses/key";
import { serverErrors } from "../utils/common";

// Type definitions
type UserAgent = string;
type ServerRequestData = {
  readonly uuid?: string;
  readonly arch: string;
  readonly os: string;
  readonly requestDate: number;
  readonly productName: string;
  readonly [key: string]: unknown;
};

type ServerResponse = {
  readonly status: boolean;
  readonly error?: string;
  readonly requestDate: number;
  readonly licenceExpire: number;
  readonly [key: string]: unknown;
};

type VerificationResult = {
  readonly status: boolean;
  readonly error?: string;
  readonly [key: string]: unknown;
};

// User agent configuration
const userAgentList: readonly UserAgent[] = [
  "Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US; Valve Steam GameOverlay/1513371133; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36"
] as const;

const getUserAgent = (): UserAgent => {
  const randomIndex = Math.floor(Math.random() * userAgentList.length);
  return userAgentList[randomIndex];
};

// Server request form creation
const getServerRequestForm = async (additionalData: Record<string, unknown>): Promise<ServerRequestData> => {
  const uuid = additionalData.uuid || await machineUuid();
  const requestDate = new Date().getTime();
  
  return {
    uuid,
    arch: arch(),
    os: platform(),
    requestDate,
    productName: "multichat",
    ...additionalData
  };
};

// Encryption utilities
const encryptServerRequestForm = (requestData: ServerRequestData): string => {
  const dataBuffer = Buffer.from(JSON.stringify(requestData), "utf8");
  return crypto.publicEncrypt(publicKey, dataBuffer).toString("base64");
};

// Response verification
const verifyServerResponse = ({
  response,
  requestDate
}: {
  readonly response: { readonly body: { readonly data: string } };
  readonly requestDate: number;
}): VerificationResult => {
  if (!response) {
    return {
      status: false,
      error: serverErrors.serverError
    };
  }

  const { body } = response;
  const decryptedData = crypto.publicDecrypt(
    publicKey, 
    Buffer.from(body.data, "base64")
  ).toString("utf8");
  
  const parsedResponse: ServerResponse = JSON.parse(decryptedData);
  
  if (parsedResponse.status) {
    if (Number(parsedResponse.requestDate) !== requestDate) {
      return {
        status: false,
        error: serverErrors.invalidResponse
      };
    }
    
    if (parsedResponse.licenceExpire < new Date().getTime()) {
      return {
        status: false,
        error: serverErrors.licenseExpired
      };
    }
  }
  
  return parsedResponse;
};

export {
  getUserAgent,
  getServerRequestForm,
  encryptServerRequestForm,
  verifyServerResponse
};

export type {
  UserAgent,
  ServerRequestData,
  ServerResponse,
  VerificationResult
};