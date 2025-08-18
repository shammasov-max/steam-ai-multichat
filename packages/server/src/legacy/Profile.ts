import SteamUser from "steam-user";
import SteamCommunity from "steamcommunity";
import request from "request";
import EventEmitter from "events";
import { getUserAgent } from "./components/utils/utils";
import { logger } from "./components/utils/logger";
import fastq from "fastq";

// DOM elements
const gamesForBoostInput = document.getElementById("games_for_boost");
const setStateAllInput = document.getElementById('setStateAll');

// Type definitions
type SteamAccount = {
  readonly login: string;
  readonly password: string;
  readonly maFile?: unknown;
  readonly no_replace_login: string;
  readonly [key: string]: unknown;
};

type MaFile = {
  readonly identity_secret: string;
  readonly [key: string]: unknown;
};

type ProxyConfig = {
  readonly host: string;
  readonly port: number;
  readonly auth?: {
    readonly user: string;
    readonly pass: string;
  };
};

type PlayGameInfo = {
  readonly isPlay: boolean;
  readonly games: string;
};

type MessageHistoryItem = {
  readonly steam_id: string;
  readonly message: string;
  readonly timestamp: Date | number;
};

type CommentInfo = {
  readonly count: number;
  readonly myItems: number;
  readonly discussions: readonly unknown[];
};

type TypingTemplate = {
  readonly interval: NodeJS.Timeout;
  readonly timeout: NodeJS.Timeout;
};

/* type SteamUser = {
  readonly steamID: string;
  readonly [key: string]: unknown;
}; */

// Steam class
export default class Profile {
  // Properties
  public inviteLink?: string;
  public removedByMe: Record<string, boolean> = {};
  public deletedFriends: Record<string, SteamUser> = {};
  public unreadMessages: Record<string, any> = {};
  public readonly unsendMessages: Record<string, unknown>;
  public newFriends: Record<string, boolean> = {};
  public oldFriends: Record<string, number> = {};
  public pinned: Record<string, boolean> = {};

  // Password change methods
  public getConfirmations!: (type: number) => Promise<unknown>;
  public acceptConfirmations!: (confirmations: unknown) => Promise<number>;
  public getRecoveryLink!: () => Promise<RecoveryLinkResponse>;
  public getRcn!: (url: string) => Promise<number>;
  public sendMobileVerification!: (link: string, retryCount?: number) => Promise<void>;
  public acceptPasswordOnMobile!: () => Promise<boolean>;
  public getRsaKey!: () => Promise<RsaKeyResponse>;
  public changePasswordRequest!: (params: {
    recoveryLink: string;
    rsaKey: RsaKeyResponse;
    passwordsFilePathName: string;
  }) => Promise<PasswordChangeResponse>;
  public verifyRecoveryCode!: (link: string) => Promise<void>;
  public verifyPassword!: (params: {
    recoveryLink: string;
    rsaKey: RsaKeyResponse;
  }) => Promise<void>;
  public getNonceKey!: () => Promise<string>;
  public changePassword!: (passwordsFilePath: string) => Promise<PasswordChangeResponse>;
  public changePasswordsWithTimeout!: (passwordsFilePath: string) => Promise<PasswordChangeResponse>;

  // Relationship methods
  public delete_friend!: (steamId: string, action?: DeleteFriendAction) => void;
  public unblock_friend!: (steamId: string) => void;
  public remove_deleted_friend!: (steamId: string) => void;
  public clear_invites!: (count: number, type: string) => void;
  public clear_friends!: (value: string | number, type: string) => void;
  public removeByMessageInChat!: (pattern: string) => Promise<void>;
  public accept_invite!: (steamId: string, notificationType?: string) => Promise<void>;
  public decline_invite!: (steamId: string, action?: InviteAction) => void;
  public new_name!: (steamId: string, nickname: string) => void;
  public addFriend!: (steamId: string) => Promise<InviteResult>;
  public invite_to_friend!: (steamId: string, retryCount?: number) => Promise<InviteResult>;
  public friend_relationship!: (steamUser: any, relationship: number) => void;
  public delete_hold_users!: (holdDays?: number) => Promise<void>;
  public clear_name_history!: () => void;
  public create_invite_link!: () => void;
  public check_user_trade!: (steamId: string) => Promise<TradeHoldInfo>;
  public wall_comment!: (steamId: string, message: string) => Promise<void>;
  public get_messages!: (steamId: string) => Promise<MessageHistoryItem[]>;
  public inventory!: (steamId: string, appId: string) => Promise<void>;
  public send_message_by_message!: (messages: string[], steamId: string) => void;
  public unpin!: (steamId: string) => void;
  public print_user!: (steamId: string, action?: string) => void;
  public customize_user_info!: (steamId: string, user: SteamUser) => Promise<void>;
  public update_statistic!: (type: string, value?: number) => void;
  public update_account_messages_counter!: () => void;

  // Community task methods
  public check_completed_task!: () => Promise<RegExpMatchArray | null>;
  public add_to_wishlist!: () => Promise<void>;
  public game_review!: () => Promise<void>;
  public rate_workshop!: () => Promise<void>;
  public view_broadcast!: () => Promise<void>;
  public discovery_queue!: () => Promise<void>;
  public community_play_game!: () => Promise<boolean>;
  public search_discussion!: () => Promise<void>;
  public subscribe_workshop!: () => Promise<void>;
  public post_status!: () => Promise<void>;
  public rateup_friend!: () => Promise<void>;
  public set_badge_and_name!: () => Promise<void>;
  public comment_profile!: () => Promise<void>;
  public join_group!: (groupId: string) => Promise<boolean>;
  public send_sticker!: () => Promise<void>;
  public invite_friend!: () => Promise<void>;
  public view_guide!: () => Promise<void>;
  public complete_tasks!: () => Promise<void>;
  public play_game!: (gameId: string, isPlay: boolean) => void;
  // Event emitter
  public readonly eventEmitter: EventEmitter;
  
  // Account and authentication
  public readonly account: SteamAccount;
  public readonly maFile: MaFile | null;
  
  // State flags
  public isAccountOpened: boolean;
  public isPrintedAllUsers: boolean;
  public loggedOn: boolean;
  public isFriendsPrinted: boolean;
  public isAccountPrinted: boolean;
  public isPlayGame: boolean;
  public handledOldFriends: boolean;
  public enteredGuardCodeManually: boolean;
  
  // Online state
  public lastOnlineState: number;
  public uiMode: number;
  
  // Messages and communication
  public readonly typingTemplates: Record<string, TypingTemplate>;
  
  // Game information
  public readonly playGameInfo: PlayGameInfo;
  
  // Statistics and data
  public readonly statistic: Record<string, unknown>;
  public readonly ownedApps: Record<string, unknown>;
  public readonly muted: Record<string, unknown>;
  public readonly spammed: Record<string, unknown>;
  
  // Account information
  public readonly accountNickname: string;
  
  // Friends and users
  public readonly users: Record<string, SteamUser>;
  public readonly myFriends: Record<string, number>;
  public readonly emotions: Record<string, unknown>;
  
  // Limits and restrictions
  public friendsLimit: number | null;
  public locked: boolean | null;
  public limited: boolean | null;
  
  // Comments
  public readonly commentInfo: CommentInfo;
  
  // Intervals and timeouts
  public reloginInterval: NodeJS.Timeout | null;
  public weblogonInterval: NodeJS.Timeout | null;
  public reloginTimeout: number;
  public lastReloginDate: number;
  
  // Client and session
  public client!: SteamUser;

  public clientSteamID64: string | null;
  public sessionID: string | null;
  public readonly jar: request.CookieJar;
  public readonly userAgent: string;
  public readonly proxy: `${'http' | 'https'}://${string}` | null;
  public readonly community: SteamCommunity;
  
  // JWT and authentication
  public jwt: any;
  public logonID: number;
  
  // Additional properties for compatibility
  public cookies: string;
  public default_proxy: unknown;
  public logged_on: boolean;
  public comment_info: CommentInfo;
  public is_friends_printed: boolean;
  public old_friends: Record<string, number> | null;
  public new_friends: Record<string, boolean>;
  public account_nickname: string;
  
  // Missing method declarations for compatibility
  public printAccount!: () => void;
  public print_account!: () => void;
  public checkFriendsLimit!: () => void;
  public getEmotions!: () => void;
  public getGames!: () => void;
  public has_ban!: () => Promise<boolean>;
  public ack_support_messages!: () => Promise<void>;
  public playGame!: (games: string, isPlay: boolean) => void;
  public setUiMode!: (mode: number) => void;
  public set_ui_mode!: (mode: number) => void;
  public friend_message!: (messageData: any) => Promise<void>;
  public friend_typing!: (steamId: string) => void;
  public get_unread_messages!: () => void;
  public relogin!: (reason: string) => void;
  public set_settings!: (url: string, options?: any) => any;
  public print_deleted_friends!: () => void;
  public typing_template!: (steamId: string, isTyping: boolean, templateName?: string) => void;

  constructor(account: SteamAccount, maFile: MaFile | null, proxy: ProxyConfig | null) {
    this.eventEmitter = new EventEmitter();
    this.account = account;
    this.maFile = maFile || (account.maFile as MaFile) || null;
    
    // Initialize state flags
    this.isAccountOpened = false;
    this.isPrintedAllUsers = false;
    this.loggedOn = false;
    this.isFriendsPrinted = false;
    this.isAccountPrinted = false;
    this.isPlayGame = false;
    this.handledOldFriends = false;
    this.enteredGuardCodeManually = false;
    
    // Initialize online state
    this.lastOnlineState = Number((setStateAllInput as HTMLInputElement)?.value) || 1;
    this.uiMode = 0;
    
    // Initialize message containers
    this.unreadMessages = {};
    this.unsendMessages = {};
    this.typingTemplates = {};
    
    // Initialize game info
    this.playGameInfo = {
      isPlay: false,
      games: ''
    };
    
    // Initialize data containers
    this.statistic = this.loadFromLocalStorage(`${this.account.login}_statistic`);
    this.ownedApps = {};
    this.muted = this.loadFromLocalStorage(`${this.account.login}_muted`);
    this.spammed = this.loadFromLocalStorage(`${this.account.login}_spammed`);
    this.newFriends = {};
    this.deletedFriends = this.loadFromLocalStorage(`${this.account.login}_deleted_friends`) as Record<string, SteamUser>;
    this.pinned = this.loadFromLocalStorage(`${this.account.login}_pinned`) as Record<string, boolean>;
    this.oldFriends = this.loadFromLocalStorage(`${this.account.login}_old_friends`) as Record<string, number>;
    this.removedByMe = {};
    
    // Initialize account info
    this.accountNickname = localStorage.getItem(`nickname_${this.account.login}`) || '';
    this.inviteLink = localStorage.getItem(`invite_link_${this.account.login}`) || '';
    
    // Initialize user containers
    this.users = {};
    this.myFriends = {};
    this.emotions = {};
    
    // Initialize limits
    this.friendsLimit = null;
    this.locked = null;
    this.limited = null;
    
    // Initialize comment info
    this.commentInfo = {
      count: 0,
      myItems: 0,
      discussions: []
    };
    
    // Initialize intervals
    this.reloginInterval = null;
    this.weblogonInterval = null;
    this.reloginTimeout = 0;
    this.lastReloginDate = 0;
    
    // Initialize client info
    this.clientSteamID64 = null;
    this.sessionID = null;
    this.jar = request.jar();
    this.userAgent = getUserAgent();
    this.proxy = proxy ? `http://${proxy.host}:${proxy.port}` : null;
    
    // Initialize JWT and authentication
    this.jwt = null;
    this.logonID = 0;
    this.cookies = '';
    this.default_proxy = null;
    this.logged_on = false;
    this.comment_info = this.commentInfo;
    this.is_friends_printed = false;
    this.old_friends = this.oldFriends;
    this.new_friends = this.newFriends;
    this.account_nickname = this.accountNickname;
    
    // Setup
    this.set_proxy(proxy);
    this.updateStatisticInternal('login');
    this.createSteamClient();
    this.community = new SteamCommunity();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  // Helper method to load data from localStorage
  private loadFromLocalStorage = (key: string): Record<string, unknown> => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) as Record<string, unknown> : {};
  };

  // Setup event listeners
  private setupEventListeners = (): void => {
    this.eventEmitter.on("stop_typing", (steamId: string) => {
      const template = this.typingTemplates[steamId];
      if (template) {
        clearInterval(template.interval);
        clearTimeout(template.timeout);
        // this.typingTemplate(steamId, false); // TODO: Implement typingTemplate method
      }
    });
  };

  // Getter for disconnected state
  get isDisconnected(): boolean {
    return !this.client.steamID;
  }

  // Create Steam client
  private createSteamClient = (): void => {
    this.client = new SteamUser({
      httpProxy: this.proxy || null
    });
    
    this.client.on('webSession', async (sessionID: string, cookies: readonly unknown[]) => {
      try {
        this.sessionID = sessionID;
        cookies.forEach((cookie: unknown) => {
          this.jar.setCookie(cookie as string, 'https://steamcommunity.com');
          this.jar.setCookie(cookie as string, "https://store.steampowered.com");
          this.jar.setCookie(cookie as string, "https://help.steampowered.com");
        });
        this.cookies = (cookies as string[]).join(';');
        this.community.setCookies(cookies as string[]);
        this.client.setPersona(this.lastOnlineState);
        this.playGame(this.playGameInfo.games, this.playGameInfo.isPlay);
        this.setUiMode(this.uiMode);
        if (!this.loggedOn) {
          this.clientSteamID64 = this.client.steamID?.getSteamID64() || null;
          this.loggedOn = true;
          this.printAccount();
          this.checkFriendsLimit();
          this.getEmotions();
          this.getGames();
          this.weblogonInterval = setInterval(() => {
            try {
              this.client.webLogOn();
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              logger.error("webLogOn " + this.account.login + " " + errorMessage);
              if (errorMessage.indexOf("without first being connected to Steam network") !== -1) {
                this.relogin("Detected disconnect at webLogOn");
              }
            }
          }, msInMinute * 30);
          if (process.settings.auto_boost) {
            this.playGame((gamesForBoostInput as HTMLInputElement)?.value || '', true);
          }
          const accountHeader = document.querySelector(".row_header.row_header_" + this.account.login);
          let pendingInvitesCount = 0;
          for (const steamId in this.myFriends) {
            if (this.myFriends[steamId] == 0x4 || this.myFriends[steamId] == 0x2) {
              if (this.myFriends[steamId] == 0x2) {
                ++pendingInvitesCount;
              }
            }
          }
          let loginMessage = '[' + process.current_account_index + '/' + process.accounts.length + "] " + this.account.login + " " + process.languages[process.settings.language].logged_in + '.';
          let hasNotifications = false;
          if (this.commentInfo.myItems > 0) {
            loginMessage += " " + process.helper.replace_log_variable(process.languages[process.settings.language].unread_comments, [this.commentInfo.myItems]) + '.';
            hasNotifications = true;
          }
          if (pendingInvitesCount > 0) {
            loginMessage += " " + process.helper.replace_log_variable(process.languages[process.settings.language].unread_invites, [pendingInvitesCount]) + '.';
            hasNotifications = true;
          }
          if (this.account.proxy !== undefined) {
            loginMessage += " Proxy: " + this.account.proxy;
          }
          process.helper.print_info(loginMessage, 'grn', hasNotifications ? "https://steamcommunity.com/profiles/" + this.clientSteamID64 : false, hasNotifications ? this.account.login : false);
          ++process.current_account_index;
          this.eventEmitter.emit("logOn", true);
          this.reloginInterval = setInterval(() => {
            if (navigator.onLine && this.isDisconnected) {
              this.relogin("No users or steamid");
            }
          }, 0x7530);
          const hasBan = await this.has_ban();
          if (hasBan) {
            accountHeader?.classList.add("locked");
            await this.ack_support_messages();
            if (!(await this.has_ban())) {
              accountHeader?.classList.remove('locked');
            } else {
              this.locked = true;
            }
          } else {
            accountHeader?.classList.remove("locked");
          }
        } else {
          this.eventEmitter.emit('logOn', true);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error("webSession " + this.account.login + " " + errorMessage);
        this.eventEmitter.emit('logOn', false);
        if (errorMessage.indexOf("write") !== -1) {
          this.relogin("Websession error");
        }
      }
    });
    this.client.on('friendPersonasLoaded', async () => {
      this.copyFriendsFromClient();
      const processGetMessages = async (steamId: string, callback: (err: Error | null) => void) => {
        await this.get_messages(steamId);
        callback(null);
      };
      const messageQueue = fastq(processGetMessages, 10);
      if (!this.is_friends_printed) {
        this.print_account();
        this.is_friends_printed = true;
      }
      for (const steamId in this.users) {
        const user = this.users[steamId];
        this.customizeUserInfoInternal(steamId, user);
        requestIdleCallback(() => this.print_user(steamId));
        messageQueue.push(steamId);
      }
      this.get_unread_messages();
    });
    this.client.on("user", (steamUser: any, userData: any) => {
      const steamId = steamUser.getSteamID64();
      this.customizeUserInfoInternal(steamId, userData);
      requestIdleCallback(() => this.print_user(steamId));
    });
    this.client.chat.on("friendMessage", (messageData: any) => this.friend_message(messageData));
    this.client.chat.on('friendTyping', (typingData: any) => this.friend_typing(typingData.steamid_friend));
    this.client.on("friendRelationship", (steamUser: any, relationship: number) => this.friend_relationship(steamUser, relationship));
    this.client.on('newComments', (count: number, myItems: number, discussions: number) => {
      if (this.logged_on && this.comment_info.myItems < myItems) {
        process.helper.print_info(process.languages[process.settings.language].new_comment + " " + this.account.login, "blue", "https://steamcommunity.com/profiles/" + this.clientSteamID64 + '/', this.account.login);
        process.helper.notificate(process.languages[process.settings.language].new_comment + " " + this.account.login, '', {
          'login': this.account.login,
          'client_id': this.clientSteamID64,
          'type': "comment"
        });
      }
      this.comment_info = {
        'count': count,
        'myItems': myItems,
        'discussions': []
      };
    });
    this.client.on("error", (error: any) => {
      const errorMessage = String(error);
      if (!this.logged_on) {
        process.helper.print_info(this.account.login + " " + errorMessage + " " + (this.proxy || ''), "red");
      }
      if (errorMessage.search(/InvalidPassword|AccessDenied/i) !== -1) {
        localStorage.removeItem(this.account.login + '_jwt');
        delete this.jwt;
      }
      this.eventEmitter.emit("logOn", false);
      logger.error("ClientError: " + this.account.login + " " + error);
      if (this.logged_on) {
        setTimeout(() => {
          this.relogin("ClientError");
        }, 10000);
      }
    });
    this.client.on('nickname', (steamUser: any, nickname: string | null) => {
      const steamId = steamUser.getSteamID64();
      if (nickname) {
        this.client.myNicknames[steamId] = nickname;
      } else {
        delete this.client.myNicknames[steamId];
      }
      this.print_user(steamId);
    });
    this.client.on('friendsList', () => {
      this.copyFriendsFromClient();
      if (!this.handledOldFriends) {
        if (this.old_friends && Object.keys(this.old_friends).length > 0) {
          for (const steamId in this.myFriends) {
            const relationship = this.myFriends[steamId];
            if (relationship == 0x3 && this.old_friends && !this.old_friends[steamId]) {
              this.new_friends[steamId] = true;
              this.pinned[steamId] = true;
              this.updateStatisticInternal("added");
            }
          }
        }
        const currentFriends: Record<string, number> = {};
        for (const steamId in this.myFriends) {
          if (this.myFriends[steamId] == 0x3) {
            currentFriends[steamId] = 1;
          }
        }
        this.old_friends = currentFriends;
        if (Object.keys(currentFriends).length > 0) {
          localStorage.setItem(this.account.login + "_old_friends", JSON.stringify(currentFriends));
        }
      }
      this.handledOldFriends = true;
    });
    this.client.on("accountLimitations", (limitations: boolean) => {
      this.limited = limitations;
    });
    this.client.on("disconnected", () => {
      this.reloginTimeout = setTimeout(() => {
        this.relogin("Disconnected");
      }, 60000) as unknown as number;
    });
    this.client.on("loggedOn", () => {
      clearTimeout(this.reloginTimeout);
    });
  }

  public copyFriendsFromClient = (): void => {
    for (const steamId in this.client.myFriends) {
      this.myFriends[steamId] = this.client.myFriends[steamId];
    }
  };

  public set_proxy = (proxyString: unknown): void => {
    if (!proxyString || typeof proxyString !== 'string') {
      (this as any).proxy = null;
      return;
    }
    const proxyParts = proxyString.trim().split(':');
    (this as any).proxy = 'http://' + (proxyParts.length === 4 ? proxyParts[2] + ':' + proxyParts[3] + '@' + proxyParts[0] + ':' + proxyParts[1] : proxyString);
    this.default_proxy = proxyString;
  };

  private updateStatisticInternal = (type?: string, value?: number): void => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();
    
    if ((this.statistic as any).month !== currentMonth) {
      (this.statistic as any) = {
        'month': currentMonth
      };
    }
    
    if (!(this.statistic as any)[currentDay]) {
      (this.statistic as any)[currentDay] = {
        'added': 0,
        'deleted': 0,
        'invites_sent': 0
      };
    }
    
    if (value && type) {
      if ((this.statistic as any)[currentDay][type]) {
        (this.statistic as any)[currentDay][type] += value;
      } else {
        (this.statistic as any)[currentDay][type] = value;
      }
    } else if (type) {
      (this.statistic as any)[currentDay][type]++;
    }
    
    localStorage.setItem(this.account.login + '_statistic', JSON.stringify(this.statistic));
  };

  public getRenderPlayerName = (steamId: string, userData: any): string => {
    let playerName = '';
    if (this.client.myNicknames[steamId]) {
      playerName = userData.player_name + " (" + this.client.myNicknames[steamId] + ')';
    } else if (userData.player_name) {
      playerName = userData.player_name;
    }
    return playerName.replace(/"|<|>/g, '');
  };

  private customizeUserInfoInternal = async (steamId: string, userData: any): Promise<void> => {
    try {
      const existingUser = this.users[steamId];
      if (userData.gameid && userData.gameid !== '0') {
        userData.persona_state = 9;
      }
      if (userData.persona_state === null || userData.persona_state === undefined) {
        userData.persona_state = userData.last_persona_state || 0;
      }
      userData.last_persona_state = existingUser ? (existingUser as any).persona_state : userData.persona_state;
      userData.render_player_name = this.getRenderPlayerName(steamId, userData);
      userData.inventory = existingUser && typeof (existingUser as any).inventory === "object" ? (existingUser as any).inventory : {};
      userData.user_info = existingUser && typeof ((existingUser as any).user_info === "object") ? (existingUser as any).user_info : {};
      userData.games_info = existingUser && typeof ((existingUser as any).games_info === 'object') ? (existingUser as any).games_info : {};
      userData.trade_hold_info = (existingUser as any)?.["trade_hold_info"] || {
        'checked': false,
        'escrow': 0
      };
      if (!userData.inventory) {
        userData.inventory = {};
      }
      userData.message_history = (existingUser as any)?.["message_history"] as MessageHistoryItem[] | undefined;
      userData.customized = true;
      this.users[steamId] = userData;
    } catch (err: unknown) {
      logger.error("customize user error: " + err + " " + steamId);
    }
  };

  public set_account_name = (nickname: string): void => {
    this.account_nickname = nickname.trim();
    const nicknameElement = document.getElementById("nickname_" + this.account.login);
    if (nicknameElement) {
      nicknameElement.innerText = this.account.login + " " + (nickname !== '' ? '(' + nickname + ')' : '');
    }
    localStorage.setItem("nickname_" + this.account.login, nickname);
  };
}

import './components/login';
import "./components/render";
import './components/chat';
import "./components/relationship";
import './components/online_state';
import "./components/request";
import './components/settings';
import "./components/community_task";
import './components/cycle';
import "./components/confirmations";
import './components/changePassword';
import { msInMinute } from "./components/utils/common";
import { PasswordChangeResponse, RecoveryLinkResponse, RsaKeyResponse } from "./components/changePassword";
import { DeleteFriendAction, InviteAction, InviteResult, TradeHoldInfo } from "./components/relationship";

