import Profile from "../Profile";
import invite_states from '../../recourses/invite_states';
export type InviteStates = Record<string | number, string>;
export type InviteStateKey = keyof typeof invite_states;
export type InviteStateValue = typeof invite_states[InviteStateKey];
import SteamUser from "steam-user";
export const getInviteStateMessage = (eresult: number): string => {
  const key = eresult.toString() as InviteStateKey;
  return invite_states[key] || "Invite Failed";
};
import fastq from "fastq";
import {
  logger
} from './utils/logger';
import request from "request";

// Extend Process type
declare global {
  interface ProcessSettings {
  [key: string]: any;
  language: string;
  auto_boost: boolean;
  wall_spam_messages: string[];
  dearest_item_language: string;
  use_invite_blacklist: boolean;
  friends_add_comment: string;
  save_deleted_friends: boolean;
  auto_message_for_new_friend: boolean;
  auto_message_timeout: number;
  not_send_auto_message_for_new_friend_if_has_messages: boolean;
  new_friend_spam_message: string;
}

  interface ProcessHelper {
    print_info(message: string, color?: string, url?: string | boolean, account?: string | boolean): void;
    replace_log_variable(template: string, variables: any[]): string;
    notificate(title: string, message: string, data: any): void;
    getInvites(profile: any, types: number[]): any[];
    mute(login: string, steamId: string, action?: string): void;
    random(max: number, min?: number): number;
    [key: string]: any;
  }

  interface ProcessSettings {
  language: string;
  auto_boost: boolean;
  wall_spam_messages: string[];
  dearest_item_language: string;
  use_invite_blacklist: boolean;
  friends_add_comment: string;
  save_deleted_friends: boolean;
  auto_message_for_new_friend: boolean;
  auto_message_timeout: number;
  not_send_auto_message_for_new_friend_if_has_messages: boolean;
  new_friend_spam_message: string;
  invite_count: number;
  invite_timeout: number;
  wall_spam_message_count: number;
  wall_spam_message_timeout: number;
  wall_spam_errors: RegExp;
  selected_games: string[];
  invite_blacklist: Set<string>;
  [key: string]: any | boolean | number | string[] | RegExp | Set<string>;
}

  interface Process {
    settings: ProcessSettings;
    helper: ProcessHelper;
    languages: Record<string, Record<string, string>>;
    invite_blacklist?: Set<string>;
    selected_games?: string[];
  }
}

// Type definitions
export type DeleteFriendAction = "delete" | "block" | "block_delete";
export type InviteAction = "ignore" | "block";

export interface RequestResponse extends request.Response {
  body: {
    failed_invites_result?: number[];
    [key: string]: any;
  };
}

export interface TradeHoldInfo {
  status: boolean;
  escrow?: number;
}

export interface InviteResult {
  success?: boolean;
  error?: {
    eresult?: number;
    message?: string;
  };
  user_id?: string;
  login?: string;
  saveID?: boolean;
}

export interface QuickInviteLink {
  token: {
    invite_link: string;
  };
}

type SteamUser2 = {
  persona_state: number;
  last_seen_online?: number;
  player_name?: string;
  render_player_name?: string;
  message_history?: any[];
  inventory?: Record<string, unknown>;
  storage: any;
  chat: any;
  steamID: any;
  options: any;
  publicIP: string;
  cellID: number;
  vanityURL: string;
  accountInfo: any;
  emailInfo: any;
  limitations: any;
  vac: any;
  wallet: any;
  licenses: any;
  gifts: any;
  users: any;
  groups: any;
  chats: any;
  myFriends: any;
  myGroups: any;
  myFriendGroups: any;
  myNicknames: any;
  picsCache: any;
  packageName: any;
  packageVersion: any;
  CurrencyData: any;
  gamesPlayed: (...args: any[]) => any;
  getPlayerCount: (...args: any[]) => any;
  serverQuery: (...args: any[]) => any;
  getServerList: (...args: any[]) => any;
  getServerSteamIDsByIP: (...args: any[]) => any;
  getServerIPsBySteamID: (...args: any[]) => any;
  getProductChanges: (...args: any[]) => any;
  getProductInfo: (...args: any[]) => any;
  getProductAccessToken: (...args: any[]) => any;
  getOwnedApps: (...args: any[]) => any;
  ownsApp: (...args: any[]) => any;
  getOwnedDepots: (...args: any[]) => any;
  ownsDepot: (...args: any[]) => any;
  getOwnedPackages: (...args: any[]) => any;
  ownsPackage: (...args: any[]) => any;
  getStoreTagNames: (...args: any[]) => any;
  getPublishedFileDetails: (...args: any[]) => any;
  removeFriend: (...args: any[]) => any;
  setPersona: (...args: any[]) => any;
  setUIMode: (...args: any[]) => any;
  getAuthSecret: (...args: any[]) => any;
  getPrivacySettings: (...args: any[]) => any;
  kickPlayingSession: (...args: any[]) => any;
  enableTwoFactor: (...args: any[]) => any;
  finalizeTwoFactor: (...args: any[]) => any;
  getSteamGuardDetails: (...args: any[]) => any;
  getCredentialChangeTimes: (...args: any[]) => any;
  logOff: (...args: any[]) => any;
  relog: (...args: any[]) => any;
  webLogOn: (...args: any[]) => any;
  requestValidationEmail: (...args: any[]) => any;
  removeAllListeners: (...args: any[]) => any;
  setOption: (...args: any[]) => any;
  setOptions: (...args: any[]) => any;
  logOn: (...args: any[]) => any;
  on: (...args: any[]) => any;
  once: (...args: any[]) => any;
  off: (...args: any[]) => any;
  removeListener: (...args: any[]) => any;
  [key: string]: any;
} & import("steam-user");

// Extend Profile type with relationship methods
declare module "../Profile" {
  interface Profile {
    delete_friend: (steamId: string, action?: DeleteFriendAction) => void;
    unblock_friend: (steamId: string) => void;
    remove_deleted_friend: (steamId: string) => void;
    clear_invites: (count: number, type: string) => void;
    clear_friends: (value: string | number, type: string) => void;
    removeByMessageInChat: (pattern: string) => Promise<void>;
    accept_invite: (steamId: string, notificationType?: string) => Promise<void>;
    decline_invite: (steamId: string, action?: InviteAction) => void;
    new_name: (steamId: string, nickname: string) => void;
    addFriend: (steamId: string) => Promise<InviteResult>;
    invite_to_friend: (steamId: string, retryCount?: number) => Promise<InviteResult>;
    friend_relationship: (steamId: string, relationship: number) => void;
    delete_hold_users: (holdDays?: number) => Promise<void>;
    clear_name_history: () => void;
    create_invite_link: () => void;
    check_user_trade: (steamId: string) => Promise<TradeHoldInfo>;
    wall_comment: (steamId: string, message: string) => Promise<void>;
    get_messages: (steamId: string) => Promise<any[]>;
    inventory: (steamId: string, appId: string) => Promise<void>;
    send_message_by_message: (messages: string[], steamId: string) => void;
    unpin: (steamId: string) => void;
    print_user: (steamId: string, action?: string) => void;
    customize_user_info: (steamId: string, user: SteamUser) => Promise<void>;
    update_statistic: (type: string, value?: number) => void;
    update_account_messages_counter: () => void;
  }
}
Profile.prototype.delete_friend = function (steamId: string, action: DeleteFriendAction = "delete"): void {
  if (action === 'block' || action === 'block_delete') {
    this.client.blockUser(steamId);
    process.helper.mute(this.account.login, steamId);
  }
  if (action === "delete" || action === 'block_delete') {
    this.client.removeFriend(steamId);
  }
  this.removedByMe[steamId] = true;
};
Profile.prototype.unblock_friend = function (steamId: string): void {
  process.helper.mute(this.account.login, steamId, "unmute");
  this.client.unblockUser(steamId);
};
Profile.prototype.remove_deleted_friend = function (steamId: string): void {
  delete this.deletedFriends[steamId];
  delete this.users[steamId];
  delete this.myFriends[steamId];
  
  const userElements = document.querySelectorAll(`.row_user_${steamId}_${this.account.login}`);
  if (userElements) {
    userElements.forEach(element => element.remove());
  }
  
  localStorage.setItem(`${this.account.login}_deleted_friends`, JSON.stringify(this.deletedFriends));
};
Profile.prototype.clear_invites = function (percentage: number, type: string): void {
  const pendingInvites: string[] = [];
  for (const steamId in this.myFriends) {
    if (this.myFriends[steamId] === 4) {
      pendingInvites.push(steamId);
    }
  }

  if (type === "invites") {
    const processInvite = (steamId: string, callback: (err: Error | null) => void) => {
      this.client.removeFriend(steamId);
      delete this.myFriends[steamId];
      setTimeout(() => callback(null), 1500);
    };

    const queue = fastq(processInvite, 10);
    const totalInvites = pendingInvites.length;
    const invitesToClear = Number((percentage / 100 * totalInvites).toFixed(0));
    
    for (let i = 0; i < invitesToClear; i++) {
      queue.push(pendingInvites[i]);
    }
  } else {
    this.client.getPersonas(pendingInvites, (error: Error | null, personas: Record<string, SteamUser>) => {
      if (!error) {
        const daysOffline = Number(percentage);
        const currentDate = new Date();
        
        for (const steamId in personas) {
          const user = personas[steamId];
          if (user.last_seen_online && currentDate.getTime() - user.last_seen_online >= 86400000 * daysOffline) {
            this.client.removeFriend(steamId);
          }
        }
      } else {
        // TODO: Replace swal with a proper error handling mechanism
        console.error("Error getting personas:", error);
      }
    });
  }
};
Profile.prototype.clear_friends = function (value: string | number, type: string): void {
  if (type === "friends_by_steamids") {
    const steamIds: Record<string, boolean> = {};
    (value as string).trim().split("\n").forEach(steamId => {
      if (steamId !== '') {
        steamIds[steamId] = true;
      }
    });

    for (const steamId in steamIds) {
      if (this.users[steamId]) {
        this.client.removeFriend(steamId);
      }
    }
  } else {
    const currentDate = value !== 'null' ? new Date() : null;
    if (currentDate) {
      const daysOffline = Number(value);
      for (const steamId in this.users) {
        const user = this.users[steamId] as SteamUser;
        if (user.persona_state === 0 && user.last_seen_online && 
            currentDate.getTime() - user.last_seen_online >= 86400000 * daysOffline) {
          this.client.removeFriend(steamId);
        }
      }
    } else {
      // Remove all friends
      for (const steamId in this.users) {
        this.client.removeFriend(steamId);
      }
    }
  }
};
Profile.prototype.removeByMessageInChat = async function (pattern: string): Promise<void> {
  const regex = new RegExp(pattern, 'i');
  for (const steamId in this.users) {
    if (this.myFriends[steamId] === 3) {
      const user = this.users[steamId] as SteamUser;
      const messages = user.message_history || (await this.get_messages(steamId));
      const matchingMessage = messages.find(({ message }) => regex.test(message));
      
      if (matchingMessage) {
        this.delete_friend(steamId);
      }
    }
  }
};
Profile.prototype.accept_invite = async function (steamId: string, notificationType: string = "swal"): Promise<void> {
  const { error } = await this.addFriend(steamId);
  
  if (!error) {
    this.myFriends[steamId] = 3;
    const inviteElement = document.getElementById(`invite_id_${steamId}`);
    if (inviteElement) {
      inviteElement.remove();
    }
  } else if (notificationType === 'swal') {
    // TODO: Replace with proper error handling
    console.error("Error accepting invite:", error.message);
  } else {
    process.helper.print_info(`Accept invite error: ${error.message}. Account: ${this.account.login}`, "red");
  }
};
Profile.prototype.decline_invite = function (steamId: string, action: InviteAction = "ignore"): void {
  if (action === "ignore") {
    this.client.removeFriend(steamId);
  } else {
    this.client.blockUser(steamId);
  }
  
  delete this.myFriends[steamId];
  
  const inviteElement = document.getElementById(`invite_id_${steamId}`);
  if (inviteElement) {
    inviteElement.remove();
  }
};
Profile.prototype.new_name = function (steamId: string, nickname: string): void {
  const accountLogin = this.account.login;
  
  this.client.setNickname(steamId, nickname, (error: Error | null) => {
    if (!error) {
      const user = this.users[steamId] as SteamUser;
      user.render_player_name = `${user.player_name} (${nickname})`;
      
      const nameElements = document.querySelectorAll(`.player_name_${steamId}_${accountLogin}`);
      nameElements.forEach(element => {
        if (element instanceof HTMLElement) {
          element.innerText = user.render_player_name || '';
        }
      });
      
      this.print_user(steamId);
    } else {
      // TODO: Replace with proper error handling
      console.error("Error setting nickname:", error);
    }
  });
};
Profile.prototype.addFriend = function (steamId: string): Promise<InviteResult> {
  return new Promise(async resolve => {
    const timeoutId = setTimeout(() => resolve({
      error: {
        message: "Steam not responding"
      },
      user_id: steamId,
      login: this.account.login,
      saveID: true
    }), 15000);

    const requestOptions = this.set_settings('https://steamcommunity.com/actions/AddFriendAjax', {
      sessionID: this.sessionID,
      steamid: steamId,
      accept_invite: 0
    });
    requestOptions.json = true;

    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      clearTimeout(timeoutId);

      if (error) {
        return resolve({
          success: false,
          error,
          saveID: true
        });
      }

      if (response.body.failed_invites_result) {
        const eresult = response.body.failed_invites_result[0];
        return resolve({
          success: false,
          error: {
            eresult,
            message: getInviteStateMessage(eresult)
          }
        });
      }

      return resolve({
        success: true
      });
    });
  });
};
Profile.prototype.invite_to_friend = function (steamId: string, retryCount: number = 0): Promise<InviteResult> {
  return new Promise(async resolve => {
    const timeoutId = setTimeout(() => resolve({
      error: {
        message: "Steam not responding"
      },
      user_id: steamId,
      login: this.account.login
    }), 15000);

    try {
      const isBlacklisted = process.settings.use_invite_blacklist && process.invite_blacklist?.has(steamId);
      
      if (!process.settings.use_invite_blacklist || !isBlacklisted) {
        process.invite_blacklist?.add(steamId);
        
        this.client.addFriend(steamId, (error: Error | null) => {
          clearTimeout(timeoutId);
          
          if (!error && process.settings.friends_add_comment && retryCount < 10) {
            const comments = process.settings.friends_add_comment.split(';');
            const randomComment = comments[process.helper.random(comments.length - 1)].trim();
            this.wall_comment(steamId, randomComment);
          }
          
          resolve({
            error,
            user_id: steamId,
            login: this.account.login
          });
        });
      } else {
        clearTimeout(timeoutId);
        resolve({
          error: {
            message: "User in blacklist"
          },
          user_id: steamId,
          login: this.account.login
        });
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      resolve({
        error: {
          message: String(err)
        },
        user_id: steamId,
        login: this.account.login
      });
    }
  });
};
Profile.prototype.friend_relationship = function (steamUser: any, relationship: number): void {
  const steamId = steamUser.getSteamID64();
  const previousRelationship = this.myFriends[steamId];
  this.myFriends[steamId] = relationship;

  // Handle friend removal or blocking
  if ([0, 1, 6, 5].includes(relationship)) {
    const user = this.users[steamId] as SteamUser;
    const userCopy = { ...user };
    const wasInvite = previousRelationship === 4 || previousRelationship === 2;

    if (user && !wasInvite) {
      const actionType = relationship === 0 ? 'remove_from_friend' : 'block_from_friend';
      const actionMessage = process.languages[process.settings.language][actionType];

      process.helper.notificate(
        `${steamId} ${user.render_player_name} ${actionMessage} ${this.account.login}`,
        '',
        {
          type: "remove",
          user_id: steamId,
          login: this.account.login
        }
      );

      const logMessage = process.helper.replace_log_variable(
        process.languages[process.settings.language][this.removedByMe[steamId] ? "remove_from_friend" : "were_removed_by"],
        [`${steamId} ${user.render_player_name}`]
      );

      process.helper.print_info(
        `${relationship === 0 ? logMessage : `${steamId} ${user.render_player_name} ${actionMessage}`}. Account: ${this.account.login}`
      );

      process.invite_blacklist?.add(steamId);
      this.update_statistic("deleted");
      delete this.unreadMessages[steamId];
      this.update_account_messages_counter();
    }

    if (wasInvite) {
      delete this.myFriends[steamId];
    }

    const userElements = document.querySelectorAll(`.row_user_${steamId}_${this.account.login}`);
    if (userElements.length > 0) {
      if (process.settings.save_deleted_friends) {
        const savedUser = { ...userCopy };
        this.deletedFriends[steamId] = savedUser;
        this.users[steamId] = savedUser;
        this.myFriends[steamId] = 3;

        userElements.forEach(element => {
          element.classList.add("deleted_friend");
          if (element instanceof HTMLElement) {
            element.oncontextmenu = (event: MouseEvent) => {
              event.preventDefault();
              if (this.pinned[steamId] && element instanceof HTMLElement && JSON.parse(element.dataset.pinned || 'false')) {
                this.unpin(steamId);
            } else {
                this.print_user(steamId, "pin");
            }
          };
        }
        });

        localStorage.setItem(`${this.account.login}_deleted_friends`, JSON.stringify(this.deletedFriends));
      } else {
        delete this.users[steamId];
        delete this.myFriends[steamId];

        const chatElement = document.querySelector(`.chat_${this.account.login}_${steamId}`);
        if (chatElement) {
          chatElement.remove();
        }

        userElements.forEach(element => element.remove());
      }
    }
  } else if (relationship === 3) {
    // Handle new friend
      this.update_statistic('added');
    delete this.deletedFriends[steamId];
    this.newFriends[steamId] = true;
    this.pinned[steamId] = true;
    this.oldFriends[steamId] = 1;
    process.invite_blacklist?.add(steamId);

    const newFriendMessage = process.helper.replace_log_variable(
      process.languages[process.settings.language].new_friend,
      [steamId, this.account.login, new Date().toString()]
    );

    process.helper.notificate(newFriendMessage, '', {
      type: "message",
      user_id: steamId,
      login: this.account.login
    });

    process.helper.print_info(newFriendMessage);

    // Handle friend state update
      setTimeout(() => {
      const user = this.users[steamId] as SteamUser;
      if (user && !user.persona_state) {
        logger.info(`${this.account.login} ${steamId} set new friend online state`);
        user.persona_state = 1;
      }

      if (!user || !user.persona_state) {
        logger.info(`${this.account.login} load new friend ${steamId}`);
        this.client.getPersonas([steamId], (error: Error | null, personas: Record<string, SteamUser>) => {
          if (!error) {
            const newUser = personas[steamId];
            newUser.persona_state = newUser.persona_state || 1;
            this.users[steamId] = newUser;
            this.customize_user_info(steamId, newUser);
            this.print_user(steamId, "pin");
            } else {
            logger.error(`${this.account.login} load new friend error: ${error}`);
            }
          });
        } else {
        this.customize_user_info(steamId, user);
        this.print_user(steamId, 'pin');
        }

      // Handle auto message
        if (process.settings.auto_message_for_new_friend && process.settings.auto_message_timeout) {
          setTimeout(async () => {
            try {
            const user = this.users[steamId] as SteamUser;
            if (user) {
                if (process.settings.not_send_auto_message_for_new_friend_if_has_messages) {
                if (!user.message_history) {
                  await this.get_messages(steamId);
                }
                if (Array.isArray(user.message_history) && user.message_history.length > 0) {
                  return;
                }
              }

              if (!user.inventory) {
                user.inventory = {};
              }

              await Promise.all(process.selected_games.map(async (gameId: string) => {
                if (!user.inventory?.[gameId]) {
                  await this.inventory(steamId, gameId);
                }
              }));

              const messages = process.settings.new_friend_spam_message.split(';').filter(msg => msg !== '');
              const randomMessage = messages[process.helper.random(messages.length - 1)].trim();
              this.send_message_by_message(randomMessage.split('|'), steamId);
            }
          } catch (err: unknown) {
            logger.error(`${this.account.login} send auto message for new friend error: ${err}`);
          }
        }, process.settings.auto_message_timeout || 10000);
      }
    }, 5000);
  } else if (relationship === 4 || relationship === 2) {
    // Handle friend request
    if (relationship === 2) {
      const requestMessage = process.helper.replace_log_variable(
        process.languages[process.settings.language].new_friend_request,
        [steamId, this.account.login]
      );
      process.helper.print_info(
        requestMessage,
        "yellow",
        `https://steamcommunity.com/profiles/${this.clientSteamID64}`,
        this.account.login
      );
    }
  }
};
Profile.prototype.delete_hold_users = async function (minHoldDays: number = 0): Promise<void> {
  let delayIndex = 0;
  for (const steamId in this.users) {
    setTimeout(async () => {
      const { status, escrow } = await this.check_user_trade(steamId);
      if (!status && escrow && Number(escrow) >= minHoldDays) {
        const message = process.helper.replace_log_variable(
          process.languages[process.settings.language].delete_hold_user,
          [steamId, this.account.login, String(escrow)]
        );
        process.helper.print_info(message);
        this.delete_friend(steamId);
      }
    }, delayIndex * 2000); // 2 seconds delay between each check
    ++delayIndex;
  }
};
Profile.prototype.clear_name_history = function (): void {
  this.community.clearPersonaNameHistory((error: Error | null) => {
    const logMessage = `${this.account.login} ${process.languages[process.settings.language].clear_name_history_log}: ${
      error 
        ? `error ${error}` 
        : process.languages[process.settings.language].clear_name_history_successfully_cleared
    }`;
    process.helper.print_info(logMessage, error ? "red" : "grn");
  });
};
Profile.prototype.create_invite_link = function (): void {
  this.client.createQuickInviteLink({
    inviteLimit: 10000 // 0x2710 in decimal
  }, (error: Error | null, result: { token: { invite_link: string } }) => {
    if (!error) {
      this.inviteLink = result.token.invite_link;
      localStorage.setItem(`invite_link_${this.account.login}`, this.inviteLink);
    }

    const logMessage = `${this.account.login} ${
      error 
        ? `Error: ${error}` 
        : `${process.languages[process.settings.language].create_link_successfully} ${this.inviteLink}`
    }`;
    process.helper.print_info(logMessage, error ? "red" : "grn");
  });
};