import Profile from "../Profile";
import inviteStates from "../../recourses/invite_states";

// Type definitions
type InviteResult = {
  readonly error?: {
    readonly eresult?: number;
    readonly message?: string;
  };
  readonly user_id: string;
};

type WallSpamResult = {
  readonly error?: string;
  readonly login: string;
  readonly user_id: string;
};

type CycleContext = {
  readonly currentIndex: number;
  readonly maxCount: number;
  readonly timeout: number;
};

// Invite cycle functionality
const inviteCycle = function(
  this: Profile,
  currentInviteCount: number = 0
): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      const hasMoreUsers = process.user_index < process.user_id_list_length;
      const hasMoreInvites = currentInviteCount < process.settings.invite_count;
      
      if (hasMoreUsers && hasMoreInvites) {
        const userId = process.user_id_list[process.user_index++];
        const isBlacklisted = process.settings.use_invite_blacklist && 
          process.invite_blacklist.has(userId);
        
        if (!isBlacklisted) {
          const inviteResult: InviteResult = await this.invite_to_friend(userId, currentInviteCount);
          
          // Clear error if user is already a friend
          if (inviteResult.error && this.myFriends[userId]) {
            inviteResult.error = undefined;
          }
          
          const isSuccess = !inviteResult.error;
          const color = isSuccess ? 'grn' : 'red';
          
          if (isSuccess) {
            this.update_statistic("invites_sent");
            ++process.successfully_added;
          }
          
          const errorMessage = inviteResult.error 
            ? (inviteStates[inviteResult.error.eresult] || inviteResult.error.message) + " " + inviteResult.user_id
            : process.languages[process.settings.language].sent_invite + " " + inviteResult.user_id;
          
          const message = `[${currentInviteCount + 1}/${process.settings.invite_count}] ${this.account.login} ${errorMessage}`;
          const profileUrl = `https://steamcommunity.com/profiles/${inviteResult.user_id}`;
          
          process.helper.print_info(message, color, profileUrl, this.account.login);
          
          // Handle specific errors
          if (inviteResult.error) {
            const errorMsg = inviteResult.error.message;
            const isLimitExceeded = errorMsg.search(/LimitExceeded|Banned|InsufficientPrivilege|Steam not response|Request timed out/i) !== -1;
            
            if (isLimitExceeded) {
              if (errorMsg.search(/Steam not response|Request timed out/i) !== -1) {
                this.relogin("Steam not respond at invite");
              }
              if (errorMsg.search(/Request timed out/i) === -1) {
                process.invite_blacklist.delete(userId);
                process.excess.push(userId);
              }
              return resolve(true);
            }
          }
        } else {
          const blacklistMessage = process.helper.replace_log_variable(
            process.languages[process.settings.language].in_blacklist,
            [userId]
          );
          const message = `[${currentInviteCount + 1}/${process.settings.invite_count}] ${this.account.login} ${blacklistMessage}`;
          process.helper.print_info(message, "red");
          --currentInviteCount;
        }
        
        setTimeout(() => {
          resolve(this.inviteCycle(++currentInviteCount));
        }, process.settings.invite_timeout || 3000);
      } else {
        return resolve(true);
      }
    } catch (error) {
      process.helper.print_info(`Adding friend error: ${error}`, 'red');
      return resolve(true);
    }
  });
};

// Wall spam cycle functionality
const wallSpamCycle = function(
  this: Profile,
  currentSpamCount: number = 0
): Promise<boolean> {
  return new Promise(async (resolve) => {
    const timeoutId = setTimeout(() => resolve(this.wallSpamCycle(++currentSpamCount)), 15000);
    
    try {
      const hasMoreUsers = process.wall_spam_user_index < process.wall_spam_id_list_length;
      const hasMoreMessages = currentSpamCount < process.settings.wall_spam_message_count;
      
      if (hasMoreUsers && hasMoreMessages) {
        const userId = process.wall_spam_id_list[process.wall_spam_user_index++];
        process.wall_spam_blacklist[userId] = 1;
        
        const spamResult: WallSpamResult = await this.wall_comment(userId);
        clearTimeout(timeoutId);
        
        const isSuccess = !spamResult.error;
        const color = isSuccess ? "grn" : "red";
        const errorMessage = spamResult.error || '';
        
        if (isSuccess) {
          ++process.successfully_wall_spammed;
        }
        
        const successMessage = process.languages[process.settings.language].comment_posted + " " + spamResult.user_id;
        const message = `[${currentSpamCount + 1}/${process.settings.wall_spam_message_count}] ${spamResult.login} ${isSuccess ? successMessage : errorMessage}`;
        const profileUrl = `https://steamcommunity.com/profiles/${spamResult.user_id}/`;
        
        process.helper.print_info(message, color, profileUrl, spamResult.login);
        
        if (spamResult.error) {
          const isRateLimited = errorMessage.search(/429|You've been posting too frequently, and can't make another post right now|слишком часто/i) !== -1;
          
          if (isRateLimited) {
            delete process.wall_spam_blacklist[userId];
            process.excess.push(spamResult.user_id);
          }
          
          if (errorMessage.search(process.wall_spam_errors) !== -1) {
            clearTimeout(timeoutId);
            return resolve(true);
          }
        }
        
        setTimeout(() => {
          resolve(this.wallSpamCycle(++currentSpamCount));
        }, process.settings.wall_spam_message_timeout);
      } else {
        clearTimeout(timeoutId);
        return resolve(true);
      }
    } catch (error) {
      process.helper.print_info(`Wall spam error: ${error}`, "red");
      clearTimeout(timeoutId);
      return resolve(true);
    }
  });
};

// Join group cycle functionality
const joinGroupCycle = function(
  this: Profile,
  currentGroupIndex: number = 0
): Promise<boolean> {
  return new Promise(async (resolve) => {
    try {
      if (currentGroupIndex < process.group_links_length) {
        const groupLink = process.group_links[currentGroupIndex];
        const joinResult = await this.join_group(groupLink);
        
        const successMessage = process.languages[process.settings.language].joined_group;
        const errorMessage = process.languages[process.settings.language].joined_error;
        const groupText = process.languages[process.settings.language].group;
        
        const message = `[${currentGroupIndex + 1}/${process.group_links_length}] ${this.account.login} ${joinResult ? successMessage : errorMessage} ${groupText}`;
        const color = joinResult ? "grn" : 'red';
        
        process.helper.print_info(message, color);
        
        setTimeout(() => {
          resolve(this.joinGroupCycle(++currentGroupIndex));
        }, 3000);
      } else {
        return resolve(true);
      }
    } catch (error) {
      process.helper.print_info(`Join group error: ${error}`, 'red');
      return resolve(true);
    }
  });
};

// Extend Steam prototype with cycle methods
Object.assign(Profile.prototype, {
  invite_cycle: inviteCycle,
  wall_spam_cycle: wallSpamCycle,
  join_group_cycle: joinGroupCycle
});

export {
  inviteCycle,
  wallSpamCycle,
  joinGroupCycle
};

export type {
  InviteResult,
  WallSpamResult,
  CycleContext
};