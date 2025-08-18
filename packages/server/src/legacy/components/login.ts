import Profile from "../Profile";
import SteamTotp from "steam-totp";
import {
  LoginSession,
  EAuthTokenPlatformType
} from "steam-session";
import {
  logger
} from './utils/logger';
import { ConstructorOptions } from "steam-session/dist/interfaces-external";
import '../types/profile-extensions';

// Type declarations for prototype extensions
declare module "../Profile" {
  export default interface Profile {
    getSteamGuardMachineToken(accountName: string): Promise<string | undefined>;
    getRefreshToken(): Promise<{status: boolean; refreshToken?: string; jwt?: any}>;
    jwtLogin(): Promise<{status: boolean; refreshToken?: string; jwt?: any}>;
    login(): Promise<boolean>;
    removeSteamHandlers(): void;
    removeEventEmitterHandlers(): void;
  }
}

declare module 'steam-user' {
  interface SteamUser {
    _readFile(filename: string): Promise<Buffer>;
    _saveFile(filename: string, data: Buffer): void;
  }
}
Profile.prototype.getSteamGuardMachineToken = async function (accountName: string) {
  try {
    const fileBuffer = await (this.client as any)._readFile("machineAuthToken." + this.account.no_replace_login + ".txt");
    return fileBuffer.toString("utf8");
  } catch (err: unknown) {}
  return undefined;
};
const decodeJwt = (jwtToken: string) => {
  let jwtParts = jwtToken.split('.');
  if (jwtParts.length != 3) {
    throw new Error("Invalid JWT");
  }
  let base64Payload = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(base64Payload, "base64").toString("utf8"));
};
Profile.prototype.getRefreshToken = async function () {
  const jwtString = localStorage.getItem(this.account.login + "_jwt");
  this.jwt = jwtString ? JSON.parse(jwtString) : null;
  if (this.jwt && (this.jwt.rt_exp || this.jwt.exp) * 1000 > new Date().getTime() && this.jwt.password === this.account.password) {
    return {
      'status': true,
      'refreshToken': this.jwt.refreshToken
    };
  }
  return this.jwtLogin();
};
Profile.prototype.jwtLogin = function () {
  return new Promise(async (resolve) => {
    const loginSessionOptions: ConstructorOptions = {
      machineFriendlyName: this.account.no_replace_login
    };
    if (this.proxy) {
      loginSessionOptions.httpProxy = typeof this.proxy === 'string' ? this.proxy : `http://${this.proxy.host}:${this.proxy.port}`;
    }
    const loginSession = new LoginSession(EAuthTokenPlatformType.SteamClient, loginSessionOptions);
    const machineToken = await this.getSteamGuardMachineToken(this.account.no_replace_login);
    const cancelLogin = () => {
      loginSession.cancelLoginAttempt();
      resolve({
        'status': false
      });
    };
    const submitGuardCode = async () => {
      const guardCode = (document.getElementById('codeInput') as HTMLInputElement)?.value.trim();
      if (guardCode === '') {
        (window as any).swal("Error", (process as any).languages[(process as any).settings.language].input_steam_guard, "error");
      } else {
        try {
          await loginSession.submitSteamGuardCode(guardCode);
        } catch (err: unknown) {
          (process as any).helper.print_info(this.account.login + ": " + err, "red");
        }
      }
    };
    try {
      const startResult = await loginSession.startWithCredentials({
        'accountName': this.account.no_replace_login,
        'password': this.account.password.trim(),
        'steamGuardCode': this.maFile ? SteamTotp.getAuthCode((this.maFile as any).shared_secret, (process as any).steamTimeOffset) : undefined,
        'steamGuardMachineToken': machineToken
      });
      if (startResult.actionRequired) {
        if ((document.getElementById('fast_auth') as HTMLInputElement)?.checked) {
          (process as any).helper.print_info(this.account.login + ": " + (process as any).languages[(process as any).settings.language].importMafile, "yellow");
          cancelLogin();
        } else {
          (process as any).helper.print_info((process as any).languages[(process as any).settings.language].enter_steam_guard + " " + this.account.login);
          const codeContainer = document.querySelector(".code") as HTMLElement;
          const codeInput = document.getElementById("codeInput") as HTMLInputElement;
          codeContainer?.classList.remove("hide");
          if (codeInput) {
            codeInput.onkeyup = (event) => {
              if (event.keyCode === 13) {
                this.enteredGuardCodeManually = true;
                submitGuardCode();
                codeInput.value = '';
              }
            };
          }
          const codeSendBtn = document.getElementById("codeSend");
          if (codeSendBtn) {
            codeSendBtn.onclick = () => {
              this.enteredGuardCodeManually = true;
              submitGuardCode();
            };
          }
          const skipBtn = document.getElementById("skip_account");
          if (skipBtn) {
            skipBtn.onclick = () => {
              delete (process as any).clients[this.account.login];
              cancelLogin();
            };
          }
          setTimeout(() => codeInput?.focus(), 200);
        }
      }
      loginSession.on("authenticated", async () => {
        const decodedJwt = decodeJwt(loginSession.refreshToken);
        this.jwt = {
          'refreshToken': loginSession.refreshToken,
          'exp': decodedJwt.exp,
          'password': this.account.password
        };
        localStorage.setItem(this.account.login + "_jwt", JSON.stringify(this.jwt));
        loginSession.cancelLoginAttempt();
        resolve({
          'status': true,
          'refreshToken': loginSession.refreshToken,
          'jwt': decodedJwt
        });
      });
      loginSession.on("timeout", () => {
        logger.error("Login Timedout " + this.account.login);
        (process as any).helper.print_info(this.account.login + " Auth timedout " + (this.proxy || ''), 'red');
        cancelLogin();
      });
      loginSession.on('steamGuardMachineToken', () => {
        if (loginSession.steamGuardMachineToken) {
          (this.client as any)._saveFile("machineAuthToken." + this.account.no_replace_login + '.txt', Buffer.from(loginSession.steamGuardMachineToken, "utf8"));
          logger.info("Save steam guard machine token " + this.account.no_replace_login);
        }
      });
      loginSession.on('error', (sessionError) => {
        logger.error("Session error: " + sessionError.message);
        (process as any).helper.print_info(this.account.login + " " + sessionError + " " + (this.proxy || ''), "red");
        cancelLogin();
      });
    } catch (err: unknown) {
      logger.error("Session error 2: " + this.account.login + " " + err + " " + (this.proxy || ''));
      (process as any).helper.print_info(this.account.login + ": " + err, "red");
      cancelLogin();
    }
  });
};
Profile.prototype.login = function () {
  return new Promise(async (resolve) => {
    try {
      const {
        status: loginStatus
      } = await this.getRefreshToken();
      if (loginStatus) {
        this.eventEmitter.once("logOn", (result) => {
          resolve(result);
        });
        this.logonID = this.logonID || Math.floor(Math.random() * 100) + 0;
        this.client.logOn({
          'refreshToken': this.jwt.refreshToken,
          'machineName': this.account.no_replace_login,
          'logonID': this.logonID
        });
      } else {
        resolve(false);
      }
    } catch (err: unknown) {
      logger.error("Login error: " + err);
      resolve(false);
    }
  });
};
Profile.prototype.removeSteamHandlers = function () {
  this.client.removeAllListeners('webSession');
  this.client.removeAllListeners('friendPersonasLoaded');
  this.client.removeAllListeners('user');
  this.client.removeAllListeners('friendTyping');
  this.client.removeAllListeners("friendMessage");
  this.client.removeAllListeners("friendRelationship");
  this.client.removeAllListeners("newComments");
  this.client.removeAllListeners("error");
  this.client.removeAllListeners("loggedOn");
  this.client.removeAllListeners("loginKey");
  this.client.removeAllListeners("steamGuard");
  this.client.removeAllListeners("nickname");
  this.client.removeAllListeners("friendsList");
  this.client.removeAllListeners("accountLimitations");
  this.client.removeAllListeners("disconnected");
  this.client.chat.removeAllListeners('friendMessage');
  this.client.chat.removeAllListeners('friendTyping');
};
Profile.prototype.removeEventEmitterHandlers = function () {
  this.eventEmitter.removeAllListeners("logOn");
  this.eventEmitter.removeAllListeners('stop_typing');
};
Profile.prototype.relogin = function (reason: string) {
  if (new Date().getTime() > this.lastReloginDate + 10000) {
    this.lastReloginDate = new Date().getTime();
    logger.info("relog " + this.account.login + ". Reason " + reason);
    try {
      this.client.relog();
    } catch (err: unknown) {
      logger.info("full relog " + this.account.login + ". Reason " + err);
      this.login();
    }
  } else {
    logger.info(this.account.login + " already rellogining");
  }
};