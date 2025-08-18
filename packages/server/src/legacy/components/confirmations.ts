import Profile from '../Profile';
import SteamTotp from 'steam-totp';

// Import swal for notifications
declare const swal: any;

// Type definitions
type ConfirmationType = 1 | 2; // 1 for market, 2 for trades

type Confirmation = {
  readonly type: ConfirmationType;
  readonly offerID?: string;
  readonly creator?: string;
  readonly [key: string]: unknown;
};

type ConfirmationResult = {
  readonly success: boolean;
  readonly count: number;
  readonly total: number;
};

type ConfirmationAction = 'accept' | 'reject';

// Get confirmations
const getConfirmations = function(
  this: Profile,
  confirmationType: ConfirmationType
): Promise<readonly Confirmation[]> {
  return new Promise((resolve) => {
    // Fix: Add null check for maFile
    if (!this.maFile) {
      resolve([]);
      return;
    }

    const steamTime = SteamTotp.time(process.steamTimeOffset);
    const confirmationKey = SteamTotp.getConfirmationKey(
      this.maFile.identity_secret,
      steamTime,
      "conf"
    );
    
    this.community.getConfirmations(steamTime, confirmationKey, (error, confirmations) => {
      if (error) {
        resolve([]);
      } else {
        // Fix: Use proper type assertion through unknown
        const filteredConfirmations = (confirmations as unknown as Confirmation[]).filter(
          confirmation => confirmation.type === confirmationType
        );
        resolve(filteredConfirmations);
      }
    });
  });
};

// Accept confirmations
const acceptConfirmations = async function(
  this: Profile,
  confirmations: readonly Confirmation[]
): Promise<number> {
  // Fix: Add null check for maFile
  if (!this.maFile) {
    return 0;
  }

  const results = await Promise.all(
    confirmations.map((confirmation, index) => {
      return new Promise<boolean>((resolve) => {
        const delay = index * 1000;
        
        setTimeout(() => {
          const identifier = confirmation.type === 2 
            ? confirmation.offerID 
            : confirmation.creator;
            
          this.community.acceptConfirmationForObject(
            this.maFile!.identity_secret, // Use non-null assertion since we checked above
            identifier,
            (error) => resolve(error === null)
          );
        }, delay);
      });
    })
  );
  
  return results.filter(result => result === true).length;
};

// Accept all confirmations
const acceptAllConfirmations = async function(
  this: Profile,
  confirmationType: ConfirmationType
): Promise<void> {
  if (!this.maFile) {
    return;
  }
  
  const languageKey = process.settings.language;
  const actionKey = confirmationType === 2 
    ? "trades_confirmation_started" 
    : "market_listing_confirmation_started";
  
  // Show success message
  swal("Success", process.languages[languageKey][actionKey], "success");
  
  // Get and accept confirmations
  const confirmations = await this.getConfirmations(confirmationType);
  const acceptedCount = await this.acceptConfirmations(confirmations);
  
  // Log results
  const successKey = confirmationType === 2 
    ? "succesfully_trades_confirmed" 
    : "succesfully_market_listing_confirmed";
  
  // Fix: Type the confirmations properly since getConfirmations returns readonly Confirmation[]
  const confirmationsArray = confirmations as readonly Confirmation[];
  const message = `${this.account.login} ${process.languages[languageKey][successKey]} ${acceptedCount}/${confirmationsArray.length}`;
  process.helper.print_info(message, 'yellow');
};

// Extend Steam prototype with confirmation methods
Object.assign(Profile.prototype, {
  getConfirmations,
  acceptConfirmations,
  acceptAllConfirmations
});

export {
  getConfirmations,
  acceptConfirmations,
  acceptAllConfirmations
};

export type {
  ConfirmationType,
  Confirmation,
  ConfirmationResult,
  ConfirmationAction
};