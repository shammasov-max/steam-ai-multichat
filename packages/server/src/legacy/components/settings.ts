import Profile from "../Profile";

// Type definitions
type PrivacySettings = {
  readonly privacyLevel: number;
};

type ProfileSettings = {
  readonly country: string;
  readonly city: string;
  readonly state: string;
  readonly [key: string]: string;
};

type SettingsContext = {
  readonly index: number;
  readonly selectedAccountsLength: number;
};

type AvatarSettings = {
  readonly avatarUrls: readonly string[];
};

type SettingsTimeout = number;

// Interface for edit profile settings
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

// Constants
const SETTINGS_TIMEOUT: SettingsTimeout = 7000;

// Privacy change functionality
const changePrivacy = function(
  this: Profile,
  privacyLevel: number,
  context: SettingsContext
): void {
  const { index, selectedAccountsLength } = context;
  
  // Fix: Use the correct method signature for profileSettings
  this.community.profileSettings(privacyLevel, (error: Error | null) => {
    const currentIndex = index + 1;
    const accountLogin = this.account.login;
    const languageKey = process.settings.language;
    const changePrivacyText = process.languages[languageKey].change_privacy;
    const successText = process.languages[languageKey].successfully_changed;
    
    const message = `[${currentIndex}/${selectedAccountsLength}] ${accountLogin} ${changePrivacyText} ${error ? `error ${error.message}` : successText}`;
    const color = error ? 'red' : 'grn';
    
    process.helper.print_info(message, color);
  });
};

// Profile change functionality
const changeProfile = function(
  this: Profile,
  context: SettingsContext
): void {
  const { index, selectedAccountsLength } = context;
  
  try {
    const profileData: ProfileSettings = {
      country: (process as any).profile_settings?.country || '',
      city: '',
      state: ''
    };

    // Process profile settings - fix property access and type issues
    const profileSettings = (process as any).profile_settings || {};
    Object.entries(profileSettings).forEach(([key, value]: [string, any]) => {
      if (value && typeof value === 'string') {
        const options = value.split(';');
        const randomIndex = process.helper.random(options.length - 1);
        const selectedOption = options[randomIndex].trim();
        (profileData as any)[key] = selectedOption;
      }
    });

    // Fix: Use the correct EditProfileSettings interface
    const editProfileData: EditProfileSettings = {
      name: profileData.country || '',
      realName: profileData.city || '',
      summary: profileData.state || '',
      customURL: '',
      country: profileData.country || '',
      state: profileData.state || '',
      city: profileData.city || '',
      featuredBadge: 0,
      background: '',
      primaryGroup: ''
    };

    this.community.editProfile(editProfileData, (error: Error | null) => {
      const currentIndex = index + 1;
      const accountLogin = this.account.login;
      const languageKey = process.settings.language;
      const changeProfileText = process.languages[languageKey].change_profile;
      const successText = process.languages[languageKey].successfully_changed;
      
      const message = `[${currentIndex}/${selectedAccountsLength}] ${accountLogin} ${changeProfileText} ${error ? `error ${error.message}` : successText}`;
      const color = error ? 'red' : 'grn';
      
      process.helper.print_info(message, color);
    });
  } catch (error) {
    const errorMessage = `${this.account.login} change profile: error: ${error}`;
    process.helper.print_info(errorMessage, 'red');
  }
};

// Avatar change functionality
const changeAvatar = function(
  this: Profile,
  context: SettingsContext
): void {
  const { index, selectedAccountsLength } = context;
  
  const avatarSettingsElement = document.getElementById("avatar_settings") as HTMLInputElement;
  if (!avatarSettingsElement) {
    process.helper.print_info(`${this.account.login} change avatar: error: avatar settings element not found`, 'red');
    return;
  }
  
  const avatarUrls = avatarSettingsElement.value.trim().split(';');
  const randomIndex = process.helper.random(avatarUrls.length - 1);
  const selectedAvatarUrl = avatarUrls[randomIndex].trim();

  // Fix: Use the correct uploadAvatar method signature
  this.community.uploadAvatar(selectedAvatarUrl, '', (error: Error | null, url: string) => {
    const currentIndex = index + 1;
    const accountLogin = this.account.login;
    const languageKey = process.settings.language;
    const changeAvatarText = process.languages[languageKey].change_avatar;
    const successText = process.languages[languageKey].avatar_successfully_changed;
    
    const message = `[${currentIndex}/${selectedAccountsLength}] ${accountLogin} ${changeAvatarText} ${error ? `error ${error.message}` : successText}`;
    const color = error ? 'red' : 'grn';
    
    process.helper.print_info(message, color);
  });
};

// Extend Steam prototype with settings methods
Object.assign(Profile.prototype, {
  change_privacy: changePrivacy,
  change_profile: changeProfile,
  change_avatar: changeAvatar
});

export {
  SETTINGS_TIMEOUT,
  changePrivacy,
  changeProfile,
  changeAvatar
};

export type {
  PrivacySettings,
  ProfileSettings,
  SettingsContext,
  AvatarSettings,
  SettingsTimeout,
  EditProfileSettings
};