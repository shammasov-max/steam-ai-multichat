import Profile from "../Profile";
import request from "request";

// Type definitions
interface RequestResponse extends request.Response {
  body: string;
}

type RequestCallback = (error: Error | null, response: RequestResponse) => void;

// Define the shape of the process global object
declare namespace NodeJS {
  interface Process {
    settings: {
      language: string;
      auto_boost: boolean;
    };
    languages: Record<string, {
      completed_community_tasks: string;
      new_comment: string;
    }>;
    helper: {
      print_info(message: string, color: string, url?: string | false, login?: string | false): void;
      replace_log_variable(template: string, vars: any[]): string;
      notificate(title: string, message: string, data: any): void;
    };
    current_account_index: number;
    accounts: any[];
  }
}

declare const process: NodeJS.Process;
interface EditProfileSettings {
  name: string;
  summary: string;
  country: string;
  state: string;
  city: string;
  customURL: string;
  realName: string;
  featuredBadge: number;
  background: string;
  primaryGroup: string;
}

// Extend Profile type with community task methods
declare module "../Profile" {
  interface Profile {
    check_completed_task: () => Promise<RegExpMatchArray | null>;
    add_to_wishlist: () => Promise<void>;
    game_review: () => Promise<void>;
    rate_workshop: () => Promise<void>;
    view_broadcast: () => Promise<void>;
    discovery_queue: () => Promise<void>;
    community_play_game: () => Promise<boolean>;
    search_discussion: () => Promise<void>;
    subscribe_workshop: () => Promise<void>;
    post_status: () => Promise<void>;
    rateup_friend: () => Promise<void>;
    set_badge_and_name: () => Promise<void>;
    comment_profile: () => Promise<void>;
    join_group: (groupId: string) => Promise<boolean>;
    send_sticker: () => Promise<void>;
    invite_friend: () => Promise<void>;
    view_guide: () => Promise<void>;
    complete_tasks: () => Promise<void>;
    play_game: (gameId: string, isPlay: boolean) => void;
  }
}

const available_tasks = {
  '3': "view_broadcast",
  '4': 'discovery_queue',
  '5': "add_to_wishlist",
  '6': 'invite_friend',
  '7': "community_play_game",
  '8': "game_review",
  '11': 'rate_workshop',
  '12': 'subscribe_workshop',
  '13': "view_guide",
  '15': "set_badge_and_name",
  '17': 'join_group',
  '18': "comment_profile",
  '19': "rateup_friend",
  '20': 'post_status',
  '23': "set_badge_and_name",
  '24': "send_sticker",
  '25': "search_discussion"
};
Profile.prototype.check_completed_task = function (): Promise<RegExpMatchArray | null> {
  return new Promise(resolve => {
    request.get(this.set_settings("https://steamcommunity.com/profiles/" + this.clientSteamID64 + "/badges/2"), (error: Error | null, response: RequestResponse) => {
      resolve(response.body.match(/_on\.|_off\./ig));
    });
  });
};
Profile.prototype.add_to_wishlist = function (): Promise<void> {
  return new Promise(resolve => {
    const requestOptions = this.set_settings("https://store.steampowered.com/api/addtowishlist/", {
      'sessionid': this.sessionID,
      'appid': 577056
    });
    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.game_review = function (): Promise<void> {
  return new Promise(resolve => {
    const reviewData = {
      'appid': 570,
      'steamworksappid': 570,
      'comment': "The Best Game",
      'rated_up': true,
      'is_public': true,
      'language': "english",
      'received_compensation': 0,
      'sessionid': this.sessionID
    };
    const requestOptions = this.set_settings("https://store.steampowered.com/friends/recommendgame/", reviewData);
    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.rate_workshop = function (): Promise<void> {
  return new Promise(resolve => {
    const requestOptions = this.set_settings("https://steamcommunity.com/sharedfiles/voteup/", {
      'id': 310989757,
      'sessionid': this.sessionID
    });
    request.post(requestOptions, (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.view_broadcast = function (): Promise<void> {
  return new Promise(async resolve => {
    const broadcastId = await new Promise<string | false>(resolveBroadcast => {
      request.get(this.set_settings("https://steamcommunity.com/apps/allcontenthome/?l=english&browsefilter=trend&browsefilter=trend&appHubSubSection=13&appHubSubSection=13&userreviewsoffset=0&broadcastsoffset=10&p=2&workshopitemspage=2&readytouseitemspage=2&mtxitemspage=2&itemspage=2&screenshotspage=2&videospage=2&artpage=2&allguidepage=2&webguidepage=2&integratedguidepage=2&discussionspage=2&numperpage=10&appid=0"), (error: Error | null, response: RequestResponse) => {
        const match = response.body.match(/watch\/(\d+)"/);
        resolveBroadcast(match ? match[1] : false);
      });
    });
    if (broadcastId) {
      request.get(this.set_settings("https://steamcommunity.com/broadcast/getbroadcastmpd/?steamid=" + broadcastId + "&broadcastid=0&viewertoken=0"), (error: Error | null, response: RequestResponse) => {
        resolve();
      });
    } else {
      resolve();
    }
  });
};
Profile.prototype.discovery_queue = function (): Promise<void> {
  return new Promise(async resolve => {
    const appIds = await new Promise<string[] | false>(resolveQueue => {
      request.get(this.set_settings("https://store.steampowered.com/explore/"), (error: Error | null, response: RequestResponse) => {
        const match = response.body.match(/\n\s+\[(.*)\],/);
        resolveQueue(match ? match[1].split(',') : false);
      });
    });
    if (appIds) {
      appIds.forEach(appId => {
        const queueData = {
          'sessionid': this.sessionID,
          'appid_to_clear_from_queue': appId,
          'snr': "1_5_9__discovery-queue-0"
        };
        request.post(this.set_settings('https://store.steampowered.com/app/' + appId, queueData), (error: Error | null, response: RequestResponse) => {});
      });
      resolve();
    } else {
      resolve();
    }
  });
};
Profile.prototype.community_play_game = async function (): Promise<boolean> {
  if (this.client && typeof this.client.gamesPlayed === 'function') {
    this.client.gamesPlayed(570);
    return true;
  }
  return false;
};
Profile.prototype.search_discussion = function (): Promise<void> {
  return new Promise(resolve => {
    request.get(this.set_settings("https://steamcommunity.com/discussions/forum/search/?q=cs+go"), (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.subscribe_workshop = function (): Promise<void> {
  return new Promise(resolve => {
    const subscribeData = {
      'id': 310989757,
      'appid': 570,
      'sessionid': this.sessionID
    };
    request.post(this.set_settings("https://steamcommunity.com/sharedfiles/subscribe", subscribeData), (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.post_status = function (): Promise<void> {
  return new Promise(resolve => {
    const statusData = {
      'sessionid': this.sessionID,
      'status_text': "Hello Friends !",
      'appid': 0
    };
    request.post(this.set_settings("https://steamcommunity.com/profiles/" + this.clientSteamID64 + "/ajaxpostuserstatus/", statusData), (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.rateup_friend = function (): Promise<void> {
  return new Promise(resolve => {
    request.post(this.set_settings("https://steamcommunity.com/actions/LogFriendActivityUpvote", {
      'sessionID': this.sessionID
    }), (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.set_badge_and_name = function (): Promise<void> {
  return new Promise(resolve => {
    const profileSettings: EditProfileSettings = {
      name: "My name",
      summary: "My summary",
      country: "US",
      state: "CA",
      city: "San Francisco",
      customURL: "myprofile",
      realName: "My realname",
      featuredBadge: 2,
      background: "",
      primaryGroup: ""
    };
    this.community.editProfile(profileSettings, error => {
      resolve();
    });
  });
};
Profile.prototype.comment_profile = function (): Promise<void> {
  return new Promise(resolve => {
    // Get first friend's ID to comment on
    let targetUserId: string | undefined;
    for (const steamId in this.users) {
      if (this.myFriends[steamId] === 3) {
        targetUserId = steamId;
        break;
      }
    }
    
    if (targetUserId) {
      this.community.postUserComment(targetUserId, ":steammocking:", () => {
        resolve();
      });
    } else {
      resolve(); // No friends to comment on
    }
  });
};
Profile.prototype.join_group = function (groupId: string): Promise<boolean> {
  return new Promise(resolve => {
    const timeoutId = setTimeout(() => resolve(false), 15000);
    this.community.joinGroup(groupId, error => {
      clearTimeout(timeoutId);
      resolve(!error);
    });
  });
};
Profile.prototype.send_sticker = function (): Promise<void> {
  return new Promise(resolve => {
    for (const steamId in this.users) {
      if (this.myFriends[steamId] == 3) {
        this.client.chat.sendFriendMessage(steamId, ':steammocking:', {
          'containsBbCode': true
        }, (error, result) => {});
        break;
      }
    }
    resolve();
  });
};
Profile.prototype.invite_friend = async function (): Promise<void> {
  const friendIdInput = document.getElementById("friend_id_for_add") as HTMLInputElement;
  if (!friendIdInput) return;
  
  const friendId = friendIdInput.value.trim();
  if (friendId) {
    this.client.addFriend(friendId, error => {});
  }
};
Profile.prototype.view_guide = function (): Promise<void> {
  return new Promise(resolve => {
    const requestOptions = this.set_settings("https://steamcommunity.com/sharedfiles/filedetails/?id=1865570612");
    requestOptions.headers["User-Agent"] = this.userAgent;
    request.get(requestOptions, (error: Error | null, response: RequestResponse) => {
      resolve();
    });
  });
};
Profile.prototype.complete_tasks = async function (): Promise<void> {
  const completionStatus = await this.check_completed_task();
  if (completionStatus) {
    const taskPromises: Promise<void | boolean>[] = [];
    completionStatus.forEach((status: string, index: number) => {
      const taskKey = index.toString() as keyof typeof available_tasks;
      const taskName = available_tasks[taskKey];
      if (taskName && status.search(/off/) !== -1) {
        const taskMethod = this[taskName as keyof Profile] as () => Promise<void | boolean>;
        taskPromises.push(taskMethod.call(this));
      }
    });
    await Promise.all(taskPromises);
    process.helper.print_info(this.account.login + " " + process.languages[process.settings.language].completed_community_tasks, "grn");
  } else {
    process.helper.print_info(this.account.login + " Can't check for completed tasks", "red");
  }
};