import Profile from "../Profile";
import request from 'request';

// Type definitions
type PersonaState = number;

type GameInfo = {
  readonly isPlay: boolean;
  readonly games: string;
};

type GameId = number;
type GameName = string;
type GameInput = GameId | GameName | readonly GameId[];

type OnlineStateFilter = {
  readonly all?: boolean;
  readonly [state: number]: boolean;
};

type SteamUser = {
  readonly persona_state: number;
  readonly [key: string]: unknown;
};

type SteamUsers = {
  readonly [steamId: string]: SteamUser;
};

// Set persona state
const setPersonaState = function(
  this: Profile,
  personaState: PersonaState
): void {
  const stateNumber = Number(personaState);
  this.client.setPersona(stateNumber);
  this.lastOnlineState = stateNumber;
};

// Parse game input
const parseGameInput = (gameInput: string): GameId[] | GameName => {
  const gameList = gameInput.split(',');
  const isSingleGameName = gameList.length === 1 && isNaN(Number(gameList[0]));
  
  if (isSingleGameName) {
    return gameList[0];
  }
  
  return gameList.map(game => Number(game));
};

// Play game functionality
const playGame = function(
  this: Profile,
  gameInput: string,
  isPlaying: boolean = true
): void {
  const parsedGames = parseGameInput(gameInput);
  
  // Request free licenses for game IDs
  if (Array.isArray(parsedGames) && parsedGames.length !== 0) {
    parsedGames.forEach(gameId => {
      if (!this.ownedApps[gameId]) {
        this.client.requestFreeLicense([gameId]);
      }
    });
  }
  
  this.client.gamesPlayed(isPlaying ? parsedGames : []);
  // Fix: Use type assertion to access mutable properties
  (this.playGameInfo as any).isPlay = isPlaying;
  (this.playGameInfo as any).games = gameInput;
};

// Get owned games
const getGames = function(this: Profile): void {
  const profileUrl = this.set_settings(
    `https://steamcommunity.com/profiles/${this.clientSteamID64}/games/?tab=all`
  );
  
  request.get(profileUrl, (error: Error | null, response: request.Response) => {
    try {
      const appIdMatches = response.body.match(/"appid":\d+,/g);
      if (appIdMatches) {
        appIdMatches.forEach((match: string) => {
          const appId = match.match(/\d+/)?.[0];
          if (appId) {
            this.ownedApps[appId] = true;
          }
        });
      }
    } catch (parseError) {
      // Silently handle parsing errors
    }
  });
};

// Set UI mode
const setUiMode = function(
  this: Profile,
  uiMode: number
): void {
  this.client.setUIMode(uiMode);
  this.uiMode = uiMode;
};

// Get Steam IDs by online states
const getSteamIdsByOnlineStates = function(
  this: Profile,
  stateFilter: OnlineStateFilter
): readonly string[] {
  return Object.entries(this.users)
    .filter(([steamId, user]) => {
      const isFriend = this.myFriends[steamId] === 3;
      // Fix: Use type assertion to access persona_state property
      const matchesState = stateFilter.all || stateFilter[(user as any).persona_state];
      return isFriend && matchesState;
    })
    .map(([steamId]) => steamId);
};

// Extend Steam prototype with online state methods
Object.assign(Profile.prototype, {
  set_persona_state: setPersonaState,
  play_game: playGame,
  get_games: getGames,
  set_ui_mode: setUiMode,
  getSteamidsByOnlineStates: getSteamIdsByOnlineStates
});

export {
  setPersonaState,
  playGame,
  getGames,
  setUiMode,
  getSteamIdsByOnlineStates
};

export type {
  PersonaState,
  GameInfo,
  GameId,
  GameName,
  GameInput,
  OnlineStateFilter,
  SteamUser,
  SteamUsers
};