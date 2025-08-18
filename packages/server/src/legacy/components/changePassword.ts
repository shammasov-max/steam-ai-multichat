import cheerio from "cheerio";
import request from 'request';
import generator from "generate-password";
import Profile from "../Profile";
import { RSA } from "./utils/rsa";
import {
  logger,
  passwordsLogger
} from './utils/logger';

// Type definitions
export interface RecoveryLinkResponse {
  status: boolean;
  link?: string;
}

export interface RsaKeyResponse {
  status: boolean;
  publickey_mod?: string;
  publickey_exp?: string;
  timestamp?: string;
}

export interface PasswordChangeResponse {
  status: boolean;
  password?: string;
}

interface RequestResponse extends request.Response {
  body: string;
}

type RequestCallback = (error: Error | null, response: RequestResponse) => void;

// Extend Profile type with password change methods
declare module "../Profile" {
  interface Profile {
    getRecoveryLink: () => Promise<RecoveryLinkResponse>;
    getRcn: (url: string) => Promise<number>;
    sendMobileVerification: (link: string, retryCount?: number) => Promise<void>;
    acceptPasswordOnMobile: () => Promise<boolean>;
    getRsaKey: () => Promise<RsaKeyResponse>;
    changePasswordRequest: (params: {
      recoveryLink: string;
      rsaKey: RsaKeyResponse;
      passwordsFilePathName: string;
    }) => Promise<PasswordChangeResponse>;
    verifyRecoveryCode: (link: string) => Promise<void>;
    verifyPassword: (params: {
      recoveryLink: string;
      rsaKey: RsaKeyResponse;
    }) => Promise<void>;
    getNonceKey: () => Promise<string>;
    changePassword: (passwordsFilePath: string) => Promise<PasswordChangeResponse>;
    changePasswordsWithTimeout: (passwordsFilePath: string) => Promise<PasswordChangeResponse>;
  }
}

const getSFromRecoveryLink = (link: string): string | null | undefined => {
  try {
    const url = new URL(link);
    return url.searchParams.get('s');
  } catch (error) {
    logger.error("getSFromRecoveryLink " + error);
  }
  return '';
};

Profile.prototype.getRecoveryLink = function (): Promise<RecoveryLinkResponse> {
  return new Promise(resolve => {
    const requestOptions = this.set_settings("https://help.steampowered.com/en/wizard/HelpChangePassword?redir=store/account/");
    request.get(requestOptions, (error: Error | null, response: RequestResponse) => {
      try {
        const $ = cheerio.load(response.body);
        const recoveryLink = $(".help_wizard_button.help_wizard_arrow_right").first().attr("href");
        resolve({
          status: recoveryLink !== undefined,
          link: recoveryLink
        });
      } catch (err: unknown) {
        resolve({
          status: false,
          link: undefined
        });
      }
    });
  });
};
Profile.prototype.getRcn = function (url: string): Promise<number> {
  const requestOptions = this.set_settings(url);
  return new Promise(resolve => {
    request.get(requestOptions, (error: Error | null, response: RequestResponse) => {
      const matches = response.body.match(/SendAccountRecoveryCode\(.*\)/)?.[0].match(/\d{4,}/g);
      resolve(Number(matches?.[1] || 0));
    });
  });
};
Profile.prototype.sendMobileVerification = function (link: string, retryCount?: number): Promise<void> {
  return new Promise(resolve => {
    const requestOptions = this.set_settings("https://help.steampowered.com/en/wizard/AjaxSendAccountRecoveryCode", {
      sessionid: this.sessionID,
      wizard_ajax: 1,
      gamepad: 0,
      s: getSFromRecoveryLink(link),
      method: 8,
      link: '',
      n: 1
    });
    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      try {
        // Handle response if needed
      } catch (err: unknown) {
        logger.error("sendMobileVerification " + err);
      }
      resolve();
    });
  });
};
Profile.prototype.acceptPasswordOnMobile = async function (): Promise<boolean> {
  try {
    const confirmations = await this.getConfirmations(6);
    const acceptedCount = await this.acceptConfirmations(confirmations);
    return acceptedCount > 0;
  } catch (err: unknown) {
    logger.error("acceptPasswordOnMobile " + err);
  }
  return false;
};
Profile.prototype.getRsaKey = function (): Promise<RsaKeyResponse> {
  return new Promise(resolve => {
    const requestOptions = this.set_settings("https://help.steampowered.com/en/login/getrsakey/", {
      sessionid: this.sessionID,
      wizard_ajax: 1,
      gamepad: 0,
      username: this.account.no_replace_login
    });
    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      try {
        const rsaData = JSON.parse(response.body);
        resolve({
          ...rsaData,
          status: rsaData.success
        });
      } catch (err: unknown) {
        resolve({
          status: false
        });
      }
    });
  });
};
Profile.prototype.changePasswordRequest = function ({
  recoveryLink,
  rsaKey,
  passwordsFilePathName
}: {
  recoveryLink: string;
  rsaKey: RsaKeyResponse;
  passwordsFilePathName: string;
}): Promise<PasswordChangeResponse> {
  return new Promise(resolve => {
    const newPassword = generator.generate({
      length: this.account.password.length,
      numbers: true
    });

    const oldCredentials = `${this.account.no_replace_login}:${this.account.password}`;
    const newCredentials = `${this.account.no_replace_login}:${newPassword}`;
    passwordsLogger.log("passwords", `Previous: ${oldCredentials} New: ${newCredentials}`);

    const publicKey = RSA.getPublicKey(rsaKey.publickey_mod!, rsaKey.publickey_exp!);
    const encryptedPassword = RSA.encrypt(newPassword, publicKey);

    const requestOptions = this.set_settings('https://help.steampowered.com/en/wizard/AjaxAccountRecoveryChangePassword/', {
      sessionid: this.sessionID,
      wizard_ajax: 1,
      gamepad: 0,
      s: getSFromRecoveryLink(recoveryLink),
      account: this.client.steamID?.accountid,
      password: encryptedPassword,
      rsatimestamp: rsaKey.timestamp
    });

    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      try {
        const responseData = JSON.parse(response.body);
        resolve({
          status: !responseData.errorMsg || responseData.errorMsg.length === 0,
          password: newPassword
        });
      } catch (err: unknown) {
        resolve({
          status: false
        });
      }
    });
  });
};
Profile.prototype.verifyRecoveryCode = function (link: string): Promise<void> {
  return new Promise(resolve => {
    const recoveryCode = getSFromRecoveryLink(link);
    const requestOptions = this.set_settings(
      "https://help.steampowered.com/en/wizard/AjaxVerifyAccountRecoveryCode" +
      `?code=&s=${recoveryCode}&reset=1&lost=0&method=8&issueid=406` +
      `&sessionid=${this.sessionID}&wizard_ajax=1&gamepad=0`
    );
    request.get(requestOptions, (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.verifyPassword = function ({
  recoveryLink,
  rsaKey
}: {
  recoveryLink: string;
  rsaKey: RsaKeyResponse;
}): Promise<void> {
  return new Promise(resolve => {
    const publicKey = RSA.getPublicKey(rsaKey.publickey_mod!, rsaKey.publickey_exp!);
    const encryptedPassword = RSA.encrypt(this.account.password, publicKey);
    const requestOptions = this.set_settings("https://help.steampowered.com/en/wizard/AjaxAccountRecoveryVerifyPassword/", {
      sessionid: this.sessionID,
      s: getSFromRecoveryLink(recoveryLink),
      lost: 2,
      reset: 1,
      password: encryptedPassword,
      rsatimestamp: rsaKey.timestamp
    });
    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.getNonceKey = async function (): Promise<string> {
  return new Promise(resolve => {
    const requestOptions = this.set_settings("https://help.steampowered.com/en/public/javascript/help.js");
    request.get(requestOptions, (error: Error | null, response: RequestResponse) => {
      const matches = response.body.match(/([a-zA-Z0-9_]+)\s*:\s*nNonce/);
      resolve(matches?.[1] || '');
    });
  });
};
Profile.prototype.changePassword = async function (passwordsFilePath: string): Promise<PasswordChangeResponse> {
  try {
    if (this.maFile) {
      const { status, link } = await this.getRecoveryLink();
      if (status && link) {
        await this.sendMobileVerification(link);
        const mobileVerified = await this.acceptPasswordOnMobile();
        const rsaKey = await this.getRsaKey();
        
        if (mobileVerified) {
          await this.verifyRecoveryCode(link);
          const { status: changeStatus, password: newPassword } = await this.changePasswordRequest({
            rsaKey,
            recoveryLink: link,
            passwordsFilePathName: passwordsFilePath
          });
          
          return {
            status: changeStatus,
            password: newPassword
          };
        }
      }
    }
  } catch (err: unknown) {
    logger.error("changePassword " + err);
  }
  
  return {
    status: false
  };
};
Profile.prototype.changePasswordsWithTimeout = function (passwordsFilePath: string): Promise<PasswordChangeResponse> {
  return new Promise(async resolve => {
    try {
      const timeoutId = setTimeout(() => {
        logger.info("changePasswordsWithTimeout timedout");
        resolve({
          status: false
        });
      }, 60000);

      const result = await this.changePassword(passwordsFilePath);
      clearTimeout(timeoutId);
      resolve(result);
    } catch (err: unknown) {
      logger.error("changePasswordsWithTimeout " + err);
      resolve({
        status: false
      });
    }
  });
};