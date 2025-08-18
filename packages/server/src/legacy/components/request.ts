import {
  webApiTokenRegex
} from './utils/common';
import Profile from "../Profile";
import request from 'request';
import SteamID from "steamid";
import cheerio from "cheerio";
import StdLib from "@doctormckay/stdlib";
import {
  logger
} from './utils/logger';
import '../types/profile-extensions';

// Type declarations for prototype extensions
declare module "../Profile" {
  export default interface Profile {

    get_invites(): Promise<any>;

    setStats(params: { gameID: number; stats: any; crc_stats: any }): Promise<any>;
    getStats(gameId: number): Promise<any>;
    loadFriends(): Promise<any>;
    loadAndSetFriends(): Promise<void>;
    loadInventory(userId: string, appId: number): Promise<any>;
    getInventoryPrice(inventoryItems: any[], appId: string): any;
    loadUserInventoryWithTrade(userId: string): Promise<boolean>;
    profile_info(userId: string): Promise<void>;
    check_friends_limit(): void;
    clear_comments(keywords?: string[], start?: number, total?: number | null, commentIds?: string[]): Promise<void>;
    remove_comment(commentId: string, userId: string): Promise<void>;
    group_invite(groupId: string, userId: string): Promise<void>;
    games_info(userId: string, gameIds: number[]): Promise<void>;
    getWebapiToken(): Promise<string>;
    getOwnedProfileItems(token: string): Promise<any>;
    setBackground(token: string, backgroundId: string): Promise<void>;
    setupProfileBackground(): Promise<void>;
    getBadges(): Promise<any>;
    setFavoriteBadge(badgeId: string, token: string): Promise<void>;
    getYearReviewBadge(): Promise<void>;
    setAvatarFrame(frameId: string, token: string): Promise<void>;
    friends_limit: number;
  }
}
const friendsOnlineStatesMap = {
  'offline': 0,
  'online': 1,
  'in-game': 9
};
let quickDescriptionLookup: Record<string, any> = {};

const getDescription = (descriptions: any[], classId: string, instanceId?: string) => {
  const lookupKey = classId + '_' + (instanceId || '0');
  if (quickDescriptionLookup[lookupKey]) {
    return quickDescriptionLookup[lookupKey];
  }
  for (let itemIndex = 0; itemIndex < descriptions.length; itemIndex++) {
    quickDescriptionLookup[descriptions[itemIndex].classid + '_' + (descriptions[itemIndex].instanceid || '0')] = descriptions[itemIndex];
  }
  return quickDescriptionLookup[lookupKey];
};
Profile.prototype.set_settings = function (url: string, formData: Record<string, any> = {}) {
  return {
    'url': url,
    'form': formData,
    'proxy': this.proxy ? this.proxy : null,
    'jar': this.jar,
    'headers': {
      'User-Agent': this.userAgent
    },
    'gzip': true
  };
};
Profile.prototype.check_user_trade = function (userId: string) {
  return new Promise((resolve) => {
    const accountId = new SteamID(userId).accountid;
    request.get(this.set_settings("https://steamcommunity.com/tradeoffer/new/?partner=" + accountId), (error, response) => {
      const userInfo = this.users[userId];
      if (error || !userInfo) {
        return resolve({
          'status': false,
          'message': '' + (error || "User doesnt exist")
        });
      }
      const playerName = (this.users[userId] as any).render_player_name;
      if (!error) {
        const escrowMatch = response.body.match(/var g_daysTheirEscrow = (\d+);/);
        const escrowDays = escrowMatch ? escrowMatch[1] : null;
        if (userInfo) {
          (userInfo as any).trade_hold_info = {
            'checked': true,
            'escrow': Number(escrowDays) || 0
          };
        }
        if (!escrowDays) {
          resolve({
            'status': false,
            'message': "Can't check " + playerName + " for trade hold"
          });
        } else {
          resolve({
            'status': !!(escrowDays == '0'),
            'message': '' + (escrowDays == '0' ? playerName + " No Trade Hold" : playerName + " Trade hold " + escrowDays + " days"),
            'escrow': escrowDays
          });
        }
      } else {
        resolve({
          'status': false,
          'message': '' + error
        });
      }
    });
  });
};
Profile.prototype.get_invites = function () {
  type InviteInfo = {
    user_id: string;
    name: string | null;
    avatar: string | null;
    type: number;
  };
  
  return new Promise((resolve) => {
    const pendingInvites = (process as any).helper.getInvites(this, [2, 4]);
    if (pendingInvites.length !== 0) {
      const invitesList: InviteInfo[] = [];
      request.get(this.set_settings("https://steamcommunity.com/profiles/" + this.clientSteamID64 + '/friends/pending'), (error, response) => {
        if (!error) {
          pendingInvites.forEach((invite: any) => {
            const {
              userId: inviteUserId,
              relationship: relationshipType
            } = invite;
            const steamId = new SteamID(inviteUserId);
            const accountId = steamId.accountid;
            const nameRegex = new RegExp("data-miniprofile=\"" + accountId + "\">(.*)</a>", 'i');
            const avatarRegex = new RegExp("<img src=\"(.*)\".*data-miniprofile=\"" + accountId + "\">");
            const nameMatch = response.body.match(nameRegex);
            const avatarMatch = response.body.match(avatarRegex);
            const userName = nameMatch ? nameMatch[1] : null;
            const avatarUrl = avatarMatch ? avatarMatch[1] : null;
            invitesList.push({
              'user_id': inviteUserId,
              'name': userName,
              'avatar': avatarUrl,
              'type': relationshipType
            });
          });
          resolve(invitesList);
        } else {
          resolve(null);
        }
      });
    } else {
      (window as any).swal(this.account.login + " " + (process as any).languages[(process as any).settings.language].have_not_invites);
      resolve(null);
    }
  });
};
Profile.prototype.wall_comment = function (userId: string, customMessage?: string) {
  return new Promise((resolve) => {
    try {
      let commentMessage = customMessage || (process as any).settings.wall_spam_messages[(process as any).helper.random((process as any).settings.wall_spam_messages.length - 1)];
      commentMessage = (process as any).helper.replaceTemplateDomains(commentMessage, (process as any).domainTemplates);
      const inviteLinkTemplate = commentMessage.match(/template_invite_link/i);
      if (inviteLinkTemplate) {
        commentMessage = commentMessage.replace(inviteLinkTemplate, this.inviteLink ? this.inviteLink : '');
      }
      this.community.postUserComment(userId, commentMessage, (error) => {
        resolve({
          'error': error,
          'user_id': userId,
          'login': this.account.login
        });
      });
    } catch (err: unknown) {
      resolve({
        'error': err,
        'user_id': userId,
        'login': this.account.login
      });
    }
  });
};
Profile.prototype.has_ban = function () {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, 20000);
    const requestSettings = this.set_settings('https://store.steampowered.com/supportmessages');
    request.get(requestSettings, (error, response) => {
      clearTimeout(timeout);
      try {
        if (response.body.search(/InitSupportMessages/i) == -1) {
          resolve(false);
        } else {
          resolve(true);
        }
      } catch (err: unknown) {
        resolve(false);
      }
    });
  });
};
Profile.prototype.ack_support_messages = function () {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => resolve(), 20000);
    const formData = {
      'sessionid': this.sessionID
    };
    request.post(this.set_settings('https://store.steampowered.com/supportmessages/ackmessages', formData), (error, response) => {
      clearTimeout(timeout);
      resolve();
    });
  });
};
Profile.prototype.setStats = function ({
  gameID,
  stats,
  crc_stats
}: {
  gameID: number;
  stats: any;
  crc_stats: any;
}) {
  return (StdLib as any).Promises.timeoutPromise(10000, (resolve: any, reject: any) => {
    const statsData = {
      'game_id': gameID,
      'settor_steam_id': this.clientSteamID64,
      'settee_steam_id': this.clientSteamID64,
      'explicit_reset': false,
      'stats': stats,
      'crc_stats': crc_stats
    };
    (this.client as any)._send(5466, statsData, (error: any, response: any) => {
      resolve();
    });
  });
};
Profile.prototype.getStats = function (gameId: number) {
  return (StdLib as any).Promises.timeoutPromise(10000, (resolve: any, reject: any) => {
    const requestData = {
      'game_id': gameId,
      'steam_id_for_user': this.clientSteamID64
    };
    (this.client as any)._send(818, requestData, (error: any, response: any) => {
      resolve(error);
    });
  });
};
Profile.prototype.loadFriends = async function () {
  type FriendInfo = {
    user_id: string | undefined;
    player_name: string;
    persona_state: number;
    avatar_url_medium: string | undefined;
    last_seen_online: Date;
    blocked: boolean;
  };
  
  return new Promise((resolve) => {
    const friendsList: FriendInfo[] = [];
    const requestSettings = this.set_settings("https://steamcommunity.com/profiles/" + this.clientSteamID64 + "/friends/");
    request.get(requestSettings, (error, response) => {
      try {
        const $ = cheerio.load(response.body);
        $(".friend_block_v2").each((index, element) => {
          try {
            const friendElement = $(element);
            const searchData = friendElement.attr("data-search");
            const isBlocked = friendElement.find(".blocked_text").length !== 0;
            const playerName = searchData ? searchData.split(';')[0].trim() : '';
            const [onlineStateKey] = Object.keys(friendsOnlineStatesMap).filter((stateKey) => friendElement.hasClass(stateKey));
            const personaState = (friendsOnlineStatesMap as any)[onlineStateKey] || 0;
            const avatarUrl = friendElement.find("img").attr("src");
            const lastOnlineRegex = /Last Online (?:(\d+) days)?(?:, )?(?:(\d+) hrs)?(?:, )?(?:(\d+) mins)? ago/;
            const lastOnlineMatch = friendElement.find(".friend_last_online_text").text().trim().match(lastOnlineRegex);
            let lastSeenDate = new Date();
            if (lastOnlineMatch) {
              const daysAgo = Number(lastOnlineMatch[1]) || 0;
              const hoursAgo = Number(lastOnlineMatch[2]) || 0;
              const minutesAgo = Number(lastOnlineMatch[3]) || 0;
              lastSeenDate.setDate(lastSeenDate.getDate() - daysAgo);
              lastSeenDate.setHours(lastSeenDate.getHours() - hoursAgo);
              lastSeenDate.setMinutes(lastSeenDate.getMinutes() - minutesAgo);
            }
            friendsList.push({
              'user_id': friendElement.attr("data-steamid"),
              'player_name': playerName.trim(),
              'persona_state': personaState,
              'avatar_url_medium': avatarUrl,
              'last_seen_online': lastSeenDate,
              'blocked': isBlocked
            });
          } catch (err: unknown) {}
        });
        resolve(friendsList);
      } catch (err: unknown) {
        logger.error("loadFriends error: " + err);
        resolve(friendsList);
      }
    });
  });
};
Profile.prototype.loadAndSetFriends = async function () {
  const friendsData = await this.loadFriends();
  friendsData.forEach((friend) => {
    if (friend.user_id) {
      this.myFriends[friend.user_id] = friend.blocked ? 6 : 3;
      const existingUser = this.users[friend.user_id];
      if (!existingUser && !friend.blocked) {
        this.customize_user_info(friend.user_id, friend);
      }
    }
  });
};
Profile.prototype.loadInventory = async function (userId: string, appId: number) {
  return new Promise((resolve, reject) => {
    const contextId = appId == 433850 ? 1 : 2;
    const language = (process as any).settings.dearest_item_language || "english";
    this.community.getUserInventoryContents(userId, appId, contextId, false, language, (error: any, inventory: any) => {
      if (error) {
        return reject(error);
      }
      return resolve(inventory);
    });
  });
};
Profile.prototype.getInventoryPrice = (inventoryItems: any[], appId: string) => {
  type InventoryItem = {
    market_hash_name: string;
    descriptions?: { value: string }[];
    tradable: boolean;
    market_tradable_restriction?: number;
    price: number;
  };
  
  if (inventoryItems.length === 0) {
    return {
      'inventory_price': "0.00",
      'inventory_hold_price': '0.00'
    };
  }
  let totalPrice = 0;
  let holdPrice = 0;
  const tradableItems: InventoryItem[] = [];
  inventoryItems.forEach((item) => {
    const itemPrice = (process as any).prices[appId][item.market_hash_name]?.["price"] || 0;
    if (itemPrice) {
      let isTradable = true;
      if (item.descriptions) {
        item.descriptions.forEach((description: any) => {
          if (description.value.search(/Not Tradable|Нельзя передавать|Не можна вимінювати|不可交易|不可交易/i) !== -1) {
            isTradable = false;
          }
        });
      }
      if (isTradable) {
        totalPrice += itemPrice;
        if (!item.tradable && item.market_tradable_restriction && item.market_tradable_restriction > 0) {
          holdPrice += itemPrice;
        }
        item.price = itemPrice;
        tradableItems.push(item);
      }
    }
  });
  const [mostExpensiveItem] = tradableItems.sort((a, b) => b.price - a.price);
  return {
    'inventory_price': totalPrice.toFixed(2),
    'inventory_hold_price': holdPrice.toFixed(2),
    'expensive_item': mostExpensiveItem,
    'inventory_price_number': Number(totalPrice)
  };
};
Profile.prototype.loadUserInventoryWithTrade = async function (userId: string) {
  type InventoryItemInfo = {
    price: number;
    name: string;
    classid: string;
  };
  
  return new Promise((resolve) => {
    const language = (process as any).settings.dearest_item_language || 'english';
    const inventoryUrl = 'https://steamcommunity.com/tradeoffer/new/partnerinventory/?sessionid=' + this.sessionID + "&partner=" + userId + "&appid=" + '730' + "&contextid=2&l=" + language;
    const requestSettings = this.set_settings(inventoryUrl);
    const customHeaders = {
      ...requestSettings.headers,
      'Referer': "https://steamcommunity.com/tradeoffer/new/?partner=" + new SteamID(userId).accountid,
      'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
      'X-Requested-With': "XMLHttpRequest",
      'Accept': "text/javascript, text/html, application/xml, text/xml, */*",
      'Accept-Encoding': "gzip, deflate, br",
      'Accept-Language': "en-GB",
      'Connection': "keep-alive",
      'Cookie': this.cookies
    };
    requestSettings.headers = customHeaders;
    (requestSettings as any).json = true;
    request.get(requestSettings, (error, response) => {
      if (error || !response.body || !this.users[userId]) {
        return resolve(false);
      }
      let totalInventoryValue = 0;
      const itemsList: InventoryItemInfo[] = [];
      for (const itemId in response.body.rgInventory) {
        try {
          const inventoryItem = response.body.rgInventory[itemId];
          const descriptionKey = inventoryItem.classid + '_' + inventoryItem.instanceid;
          const itemDescription = response.body.rgDescriptions[descriptionKey];
          const itemPrice = (process as any).prices['730'][itemDescription.market_hash_name].price;
          if (itemPrice) {
            totalInventoryValue += itemPrice;
            itemDescription.price = itemPrice;
            itemsList.push({
              'price': itemPrice,
              'name': itemDescription.market_name,
              'classid': itemDescription.classid
            });
          }
        } catch (err: unknown) {}
      }
      const sortedItems = itemsList.sort((a, b) => b.price - a.price);
      (this.users[userId] as any).inventory['730'] = {
        'inventory_price': totalInventoryValue.toFixed(2),
        'inventory_hold_price': (0).toFixed(2),
        'expensive_item': sortedItems[0],
        'inventory_price_number': Number(totalInventoryValue),
        'items': itemsList
      };
      return resolve(true);
    });
  });
};
Profile.prototype.inventory = async function (_0x362c78, _0x2c67e6) {
  if (_0x2c67e6 == 730) {
    return this.loadUserInventoryWithTrade(_0x362c78);
  }
  return new Promise(async _0x2e6156 => {
    const _0x2c57f8 = this.users[_0x362c78];
    quickDescriptionLookup = {};
    let _0x337ec8 = 0;
    let _0x5317e7 = 0;
    const _0x165cdf = [];
    const _0x17b839 = async (_0x29287b, _0x13efba = 0) => {
      return new Promise(_0x2d3b72 => {
        const _0x2a332b = _0x2c67e6 == 433850 ? 1 : 2;
        const _0x53cb4e = process.settings.dearest_item_language || "english";
        const _0xbe2d45 = "https://steamcommunity.com/inventory/" + _0x362c78 + '/' + _0x2c67e6 + '/' + _0x2a332b + "?l=" + _0x53cb4e + "&count=" + 2000;
        const _0x22ace9 = this.set_settings(_0xbe2d45);
        const _0x588ba1 = {
          ..._0x22ace9.headers,
          'Referer': 'https://steamcommunity.com/profiles/' + _0x362c78 + '/inventory/',
          'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
          'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          'Accept-Language': "en-GB,en;q=0.9",
          'Connection': "keep-alive",
          'Accept-Encoding': "gzip, deflate, br",
          'Host': 'steamcommunity.com'
        };
        _0x22ace9.headers = _0x588ba1;
        request.get(_0x22ace9, (_0x15b2e5, _0xbf4222) => {
          try {
            if (!this.users[_0x362c78]) {
              return _0x2d3b72(false);
            }
            if (_0xbf4222?.["statusCode"] === 403 || _0xbf4222?.["statusCode"] === 401) {
              this.users[_0x362c78].inventory[_0x2c67e6] = {
                'inventory_price': "0.00",
                'inventory_hold_price': "0.00"
              };
              return _0x2d3b72(false);
            }
            if (_0x2c57f8 && !_0x15b2e5 && _0xbf4222.statusCode === 200) {
              const _0x290ad3 = JSON.parse(_0xbf4222.body);
              const _0x5b6c11 = _0x290ad3.assets;
              const _0x3ffe8f = _0x290ad3.descriptions;
              if (_0x3ffe8f) {
                _0x5b6c11.forEach(_0x49834f => {
                  try {
                    const _0x4a33a1 = getDescription(_0x3ffe8f, _0x49834f.classid, _0x49834f.instanceid);
                    const _0x5b7717 = process.prices[_0x2c67e6][_0x4a33a1.market_hash_name].price || 0;
                    let _0x578b9b = true;
                    let _0x47f8a8 = false;
                    if (_0x4a33a1.descriptions) {
                      _0x4a33a1.descriptions.forEach(_0x2e92c8 => {
                        if (_0x2e92c8.value.search(/Not Tradable|Нельзя передавать|Не можна вимінювати|不可交易|不可交易/i) !== -1) {
                          _0x578b9b = false;
                        }
                      });
                    }
                    if (_0x578b9b) {
                      _0x337ec8 += _0x5b7717;
                      if (!_0x4a33a1.tradable && _0x4a33a1.market_tradable_restriction && _0x4a33a1.market_tradable_restriction > 0) {
                        _0x5317e7 += _0x5b7717;
                        _0x47f8a8 = true;
                      }
                      _0x4a33a1.price = _0x5b7717;
                    }
                    _0x165cdf.push({
                      'price': _0x5b7717,
                      'name': _0x4a33a1.market_name,
                      'classid': _0x4a33a1.classid,
                      ...(!_0x578b9b && {
                        'nonTradable': true
                      }),
                      ...(_0x47f8a8 && {
                        'hold': true
                      })
                    });
                  } catch (err: unknown) {}
                });
                _0x2d3b72(true);
              } else {
                if (_0x290ad3.error && _0x290ad3.error.search(/Called method busy, action not taken/i) !== -0x1) {
                  this.users[_0x362c78].inventory[_0x2c67e6] = {
                    'inventory_price': 'unchecked',
                    'inventory_hold_price': "unchecked"
                  };
                }
                if (_0x290ad3.total_inventory_count == 0x0) {
                  this.users[_0x362c78].inventory[_0x2c67e6] = {
                    'inventory_price': '0.00',
                    'inventory_hold_price': "0.00"
                  };
                }
                _0x2d3b72(false);
              }
            }
          } catch (err: unknown) {
            if (this.users[_0x362c78]) {
              if (_0xbf4222.body == "null") {
                this.users[_0x362c78].inventory[_0x2c67e6] = {
                  'inventory_price': "0.00",
                  'inventory_hold_price': "0.00"
                };
              } else {
                this.users[_0x362c78].inventory[_0x2c67e6] = {
                  'inventory_price': "unchecked",
                  'inventory_hold_price': "unchecked"
                };
              }
            }
            _0x2d3b72(false);
          }
        });
      });
    };
    const _0x1a5c57 = await _0x17b839();
    if (!this.users[_0x362c78]) {
      return _0x2e6156(_0x1a5c57);
    }
    const _0x11cccd = _0x165cdf.sort((_0x2242dd, _0x8691ee) => _0x8691ee.price - _0x2242dd.price);
    this.users[_0x362c78].inventory[_0x2c67e6] = {
      'inventory_price': _0x337ec8.toFixed(2),
      'inventory_hold_price': _0x5317e7.toFixed(2),
      'expensive_item': _0x11cccd[0],
      'inventory_price_number': Number(_0x337ec8),
      'items': _0x165cdf
    };
    _0x2e6156(_0x1a5c57);
  });
};
Profile.prototype.profile_info = function (_0x505228) {
  return new Promise(_0x1fa2c1 => {
    const _0x185e9a = {};
    request.get(this.set_settings("https://steamcommunity.com/profiles/" + _0x505228 + '/'), (_0x234bca, _0x62c19d) => {
      try {
        if (_0x234bca || _0x62c19d.statusCode == 429) {
          return _0x1fa2c1();
        }
        const _0x3cbb2a = _0x62c19d.body.match(/<div class="(friendPlayerLevel.*)"></i);
        const _0x50efe4 = _0x62c19d.body.match(/<span class="friendPlayerLevelNum">(\d+)<\/span><\/div><\/div>/i);
        const _0x22e500 = _0x62c19d.body.match(/<img class="profile_flag" src="(.*)">/);
        if (_0x3cbb2a) {
          _0x185e9a.lvl_class = _0x3cbb2a[1];
        }
        if (_0x50efe4) {
          _0x185e9a.lvl = _0x50efe4[1];
        }
        if (_0x22e500) {
          _0x185e9a.country = _0x22e500[1];
        }
        this.users[_0x505228].user_info = _0x185e9a;
        _0x1fa2c1();
      } catch (err: unknown) {
        _0x1fa2c1();
      }
    });
  });
};
Profile.prototype.check_friends_limit = function () {
  request.get(this.set_settings("https://steamcommunity.com/profiles/" + this.clientSteamID64 + '/friends/'), (_0x5c5ee7, _0x4e01aa) => {
    try {
      const _0x174441 = _0x4e01aa.body.match(/g_cFriendsLimit = (\d+);/);
      if (_0x174441) {
        this.friends_limit = Number(_0x174441[1]);
      }
    } catch (err: unknown) {
      this.friends_limit = 0;
    }
  });
};
Profile.prototype.clear_comments = function (_0x48f92d = [], _0xd4e9e9 = 0, _0x414e12 = null, _0x1350ea = []) {
  return new Promise(async _0x1c168c => {
    if (_0x414e12 == null || _0xd4e9e9 <= _0x414e12) {
      try {
        const _0x5678cf = {
          'start': _0xd4e9e9,
          'totalcount': _0x414e12,
          'count': 6,
          'sessionid': this.sessionID,
          'feature2': -1
        };
        const _0x183581 = this.set_settings('https://steamcommunity.com/comment/Profile/render/' + this.clientSteamID64 + "/-1/", _0x5678cf);
        request.post(_0x183581, async (_0x38698b, _0x57abb4) => {
          const _0x1b4dae = JSON.parse(_0x57abb4.body);
          if (!_0x414e12) {
            _0x414e12 = _0x1b4dae.total_count;
          }
          const _0x357655 = cheerio.load(_0x1b4dae.comments_html);
          _0x357655(".commentthread_comment_text").each((_0x22dce3, _0x20046e) => {
            const _0x50ec9c = _0x357655(_0x20046e);
            const _0x2a8a40 = _0x50ec9c.text();
            if (_0x48f92d.length === 0 || _0x48f92d.filter(_0x22aa88 => _0x2a8a40.search(new RegExp(_0x22aa88, 'i')) !== -1).length !== 0) {
              const [_0x35444d] = _0x50ec9c.attr('id').match(/\d+/);
              _0x1350ea.push(_0x35444d);
            }
          });
          _0x1c168c(this.clear_comments(_0x48f92d, _0xd4e9e9 += 6, _0x414e12, _0x1350ea));
        });
      } catch (err: unknown) {
        process.helper.print_info(this.account.login + " clear comments error: " + err, "red");
        _0x1c168c();
      }
    } else {
      await Promise.all(_0x1350ea.map(_0x1f925c => this.remove_comment(_0x1f925c, 0x0)));
      _0x1c168c();
    }
  });
};
Profile.prototype.remove_comment = function (_0x5c8024, _0x2ea409) {
  return new Promise(_0x39094c => {
    const _0x2ff4a4 = setTimeout(() => _0x39094c(), 10000);
    this.community.deleteUserComment(this.clientSteamID64, _0x5c8024, () => {
      clearTimeout(_0x2ff4a4);
      _0x39094c();
    });
  });
};
Profile.prototype.group_invite = function (_0x3f9421, _0x353e46) {
  return new Promise(_0x22b940 => {
    const _0x14ba00 = {
      'json': 1,
      'type': "groupInvite",
      'group': '' + _0x3f9421,
      'sessionID': this.sessionID,
      'invitee': _0x353e46
    };
    const _0x9ff0d0 = this.set_settings('https://steamcommunity.com/actions/GroupInvite', _0x14ba00);
    request.post(_0x9ff0d0, (_0x530885, _0x17f80d) => {
      _0x22b940();
    });
  });
};
Profile.prototype.games_info = function (_0x304da5, _0x2ea80e) {
  return new Promise(_0x1b1d61 => {
    const _0x20ea31 = this.set_settings("https://steamcommunity.com/profiles/" + _0x304da5 + '/games/?tab=all');
    request.get(_0x20ea31, (_0x4bb301, _0xb36d10) => {
      try {
        const _0x53d825 = this.users[_0x304da5];
        const _0x3e3d8b = {};
        if (_0x4bb301 || !_0x53d825) {
          return _0x1b1d61();
        }
        const _0x5d2f01 = _0xb36d10.body.match(/data-profile-gameslist="(.*)"/);
        if (_0x5d2f01) {
          const _0x55de68 = JSON.parse(_0x5d2f01[0x1].replaceAll("&quot;", "\""));
          const _0x317949 = _0x55de68.rgGames.filter(_0x34d165 => _0x2ea80e.indexOf(_0x34d165.appid) !== -0x1);
          _0x317949.forEach(_0x3dfc2c => {
            _0x3e3d8b[_0x3dfc2c.appid] = {
              'status': true
            };
            const _0x4ba2c2 = _0x3dfc2c.playtime_forever < 60 ? _0x3dfc2c.playtime_forever : _0x3dfc2c.playtime_forever / 60;
            if (_0x3dfc2c.playtime_2weeks) {
              const _0x2ed3b6 = _0x3dfc2c.playtime_2weeks < 60 ? _0x3dfc2c.playtime_2weeks : _0x3dfc2c.playtime_2weeks / 60;
              _0x3e3d8b[_0x3dfc2c.appid].playtime_2weeks = Math.floor(_0x2ed3b6);
            }
            _0x3e3d8b[_0x3dfc2c.appid].hours_forever = Math.floor(_0x4ba2c2);
            _0x3e3d8b[_0x3dfc2c.appid].last_played = _0x3dfc2c.rtime_last_played;
          });
        } else {
          _0x2ea80e.forEach(_0xf78e02 => {
            _0x3e3d8b[_0xf78e02] = {
              'status': false
            };
          });
        }
        _0x53d825.games_info = _0x3e3d8b;
        _0x1b1d61();
      } catch (err: unknown) {
        _0x1b1d61();
      }
    });
  });
};


Profile.prototype.getWebapiToken = async function () {
  return new Promise((_0x3df816, _0xb59ce0) => {
    const _0x52bdfe = setTimeout(() => _0xb59ce0("Timed out"), 0x1388);
    const _0x20a989 = this.set_settings('https://steamcommunity.com');
    request.get(_0x20a989, (_0x3410c8, _0x353df5) => {
      clearTimeout(_0x52bdfe);
      try {
        const _0x18b1af = _0x353df5.body.match(webApiTokenRegex);
        if (_0x18b1af) {
          _0x3df816(_0x18b1af[0x1]);
        } else {
          _0xb59ce0("Cant obtain token");
        }
      } catch (err: unknown) {
        _0xb59ce0(err);
      }
    });
  });
};
Profile.prototype.getOwnedProfileItems = async function (_0x3f07a5) {
  return new Promise((_0x20e732, _0x1fbe2e) => {
    const _0x1a1b97 = setTimeout(() => _0x1fbe2e("Timed out"), 0x1388);
    const _0x27bd6d = this.set_settings('https://api.steampowered.com/IPlayerService/GetProfileItemsOwned/v1?access_token=' + _0x3f07a5);
    _0x27bd6d.json = true;
    request.get(_0x27bd6d, (_0x18559a, _0x4b85c4) => {
      clearTimeout(_0x1a1b97);
      _0x20e732(_0x4b85c4.body);
    });
  });
};
Profile.prototype.setBackground = function (_0x316aee, _0x21d4f8) {
  return new Promise((_0x169016, _0x1d2205) => {
    const _0xaff454 = setTimeout(() => _0x1d2205("Timed out"), 5000);
    const _0x53a8c3 = this.set_settings("https://api.steampowered.com/IPlayerService/SetProfileBackground/v1?access_token=" + _0x316aee, {
      'communityitemid': _0x21d4f8
    });
    request.post(_0x53a8c3, (_0x5acb2b, _0x3ee27c) => {
      clearTimeout(_0xaff454);
      _0x169016();
    });
  });
};
Profile.prototype.setupProfileBackground = async function () {
  try {
    const _0x208d5d = await this.getWebapiToken();
    const _0x5df54d = await this.getOwnedProfileItems(_0x208d5d);
    if (_0x5df54d.response.profile_backgrounds) {
      const _0x3c524a = _0x5df54d.response.profile_backgrounds[process.helper.random(_0x5df54d.response.profile_backgrounds.length - 0x1)];
      await this.setBackground(_0x208d5d, _0x3c524a.communityitemid);
      process.helper.print_info(this.account.login + " " + process.languages[process.settings.language].backgroundSetuped + " " + _0x3c524a.name, 'grn');
    } else {
      process.helper.print_info(this.account.login + " " + process.languages[process.settings.language].noAvaialbleBackgrounds, "yellow");
    }
  } catch (err: unknown) {
    process.helper.print_info(this.account.login + " setupProfileBackground error: " + err, "red");
  }
};
Profile.prototype.getBadges = async function () {
  return new Promise((_0x3b0948, _0x5c725b) => {
    const _0x19d1df = setTimeout(() => _0x5c725b("Timed out"), 5000);
    const _0x49270f = this.set_settings("https://steamcommunity.com/profiles/" + this.clientSteamID64 + "/edit/favoritebadge");
    request.get(_0x49270f, (_0x3409a8, _0x1be02d) => {
      clearTimeout(_0x19d1df);
      const _0x510975 = _0x1be02d.body.match(/InitBadges\(\s+(\[.*\])/);
      if (_0x510975) {
        return _0x3b0948({
          'badges': JSON.parse(_0x510975[1]),
          'access_token': _0x1be02d.body.match(webApiTokenRegex)[1]
        });
      }
      _0x5c725b("Cant find badges");
    });
  });
};
Profile.prototype.setFavoriteBadge = async function (_0x1cb1f6, _0x329ea5) {
  return new Promise((_0x3f2a53, _0x15aba7) => {
    const _0x440259 = setTimeout(() => _0x15aba7("Timed out"), 0x1388);
    const _0x5e906f = this.set_settings('https://api.steampowered.com/IPlayerService/SetFavoriteBadge/v1?access_token=' + _0x329ea5, {
      'badgeid': _0x1cb1f6
    });
    request.post(_0x5e906f, (_0x13c541, _0x5b1fb7) => {
      clearTimeout(_0x440259);
      _0x3f2a53();
    });
  });
};
Profile.prototype.getYearReviewBadge = async function () {
  return new Promise(_0x4b9f4a => {
    const _0x424ec9 = this.set_settings("https://store.steampowered.com/yearinreview/" + this.clientSteamID64 + '/' + new Date().getFullYear());
    request.get(_0x424ec9, (_0x562d61, _0x22bbd3) => {
      _0x4b9f4a();
    });
  });
};
Profile.prototype.setAvatarFrame = async function (_0x5d8c7a, _0x4639c0) {
  return new Promise((_0x2122b1, _0x2c11c0) => {
    const _0x1890b1 = setTimeout(() => _0x2c11c0("Timed out"), 5000);
    const _0x1f018f = this.set_settings("https://api.steampowered.com/IPlayerService/SetAvatarFrame/v1?access_token=" + _0x4639c0 + "&communityitemid=" + _0x5d8c7a);
    request.post(_0x1f018f, (_0x4107e7, _0x3ad69a) => {
      clearTimeout(_0x1890b1);
      _0x2122b1();
    });
  });
};