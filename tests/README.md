# Test Setup and Fixtures Guide

## Test Account Fixtures

### Location and Format

Test accounts are stored in `fixtures/all.txt` with the following format:
```
username:password - proxyHost:proxyPort:proxyUser:proxyPass
```

Example:
```
bsorb4694:kfwxi0784 - 45.151.145.182:3000:vlQ0qd:1zsNuGOYS9
```

Each account has a corresponding maFile in `fixtures/mafile/{username}.maFile`

### Understanding maFiles

maFiles are Steam Mobile Authenticator files containing:
- `shared_secret`: For generating 2FA codes
- `identity_secret`: For confirming trades/market listings
- `account_name`: Steam username
- `Session`: Authentication tokens (may need refresh)

### How to Parse Test Accounts

```typescript
interface TestAccount {
  username: string;
  password: string;
  proxyHost: string;
  proxyPort: string;
  proxyUser: string;
  proxyPass: string;
  maFile: any;
  proxyUrl: string;
}

function parseTestAccounts(): TestAccount[] {
  const fixturesPath = path.join(process.cwd(), 'fixtures', 'all.txt');
  const content = fs.readFileSync(fixturesPath, 'utf-8');
  const accounts: TestAccount[] = [];

  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line) return;

    // Format: username:password - proxyHost:proxyPort:proxyUser:proxyPass
    const match = line.match(/^(.+?):(.+?)\s+-\s+(.+?):(\d+):(.+?):(.+?)$/);
    if (match) {
      const [, username, password, proxyHost, proxyPort, proxyUser, proxyPass] = match;
      
      // Load corresponding maFile
      const maFilePath = path.join(process.cwd(), 'fixtures', 'mafile', `${username}.maFile`);
      if (fs.existsSync(maFilePath)) {
        const maFile = JSON.parse(fs.readFileSync(maFilePath, 'utf-8'));
        accounts.push({
          username,
          password,
          proxyHost,
          proxyPort,
          proxyUser,
          proxyPass,
          maFile,
          proxyUrl: `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`
        });
      }
    }
  });

  return accounts;
}
```

## Using Test Accounts in Tests

### For Bot Testing (Server-side)
```typescript
const account = testAccounts[0]; // Use first account as bot

// Add bot to application
const botResponse = await request.post(`${apiUrl}/api/bots`, {
  data: {
    maFileJSON: JSON.stringify(account.maFile),
    proxyUrl: account.proxyUrl,
    label: `Test Bot - ${account.username}`
  }
});
```

### For User Simulation (Client-side)
```typescript
const userAccount = testAccounts[1]; // Different account as user

// Create Steam agent for user
const userAgent = createSteamAgent({
  maFile: userAccount.maFile,
  password: userAccount.password,
  userName: userAccount.username,
  proxy: userAccount.proxyUrl
});

await userAgent.login();
const userSteamID = userAgent.getSteamID();
```

### Bot-to-User Interaction Pattern
```typescript
// Account allocation for interaction tests
const botAccount = testAccounts[0];   // Bot (controlled by app)
const userAccount = testAccounts[1];   // User (sending messages)

// Or for multiple users
const botAccount = testAccounts[0];
const userAccounts = testAccounts.slice(1, 4); // 3 users
```

## Test Account Management

### Available Accounts
The fixture file contains 10 test accounts:
1. `bsorb4694` - Primary bot testing
2. `bsmsu9753` - User simulation
3. `cbjzirbjyp` - Multi-user testing
4. `aadjk5590` - Integration tests
5. `boodb7727` - Load testing
6. `acikp7997` - Backup bot
7. `bvsoadwinx` - Spam testing
8. `budii0027` - Toggle testing
9. `bsqxqwmgnm` - Concurrent ops
10. `byrjr0703` - E2E flows

### Proxy Configuration
Each account has a dedicated sticky proxy to:
- Avoid IP bans
- Maintain consistent sessions
- Comply with Steam's rate limits

Format: `http://proxyUser:proxyPass@proxyHost:proxyPort`

### Important Considerations

1. **Rate Limiting**: Steam enforces 1 friend invite per minute per account
2. **Session Expiry**: maFile sessions may expire and need refresh
3. **Proxy Health**: Ensure proxies are active before running tests
4. **Account Rotation**: Rotate accounts to avoid triggering Steam's anti-abuse

## Running Tests with Fixtures

### Setup Environment
```bash
# 1. Ensure fixtures are in place
ls -la fixtures/
ls -la fixtures/mafile/

# 2. Set up test database
npm run test:setup

# 3. Run tests
npm test
```

### Debug Failed Authentication
```bash
# Check if maFile is valid
cat fixtures/mafile/username.maFile | jq .

# Test proxy connectivity
curl -x http://proxyUser:proxyPass@proxyHost:proxyPort https://api.ipify.org

# Run single account test
DEBUG=* npx playwright test -g "single bot"
```

### Troubleshooting

**Authentication Failures:**
- Check maFile `Session` tokens aren't expired
- Verify proxy is working
- Ensure Steam Guard is properly configured

**Rate Limit Issues:**
- Wait 60 seconds between friend invites
- Use different accounts for parallel tests
- Check system time synchronization

**Missing Fixtures:**
- Ensure `fixtures/all.txt` exists
- Verify maFiles match usernames in all.txt
- Check file permissions

## Creating New Test Accounts (If Needed)

1. **Create Steam Account**
   - Use unique email
   - Set up Steam Guard with mobile app

2. **Extract maFile**
   - Use Steam Desktop Authenticator (SDA)
   - Export the .maFile from SDA
   - Place in `fixtures/mafile/`

3. **Set Up Proxy**
   - Purchase sticky proxy
   - Test connectivity
   - Add to credentials file

4. **Add to fixtures/all.txt**
   ```
   newusername:password - proxy.host:3000:proxyUser:proxyPass
   ```

## Best Practices

1. **Account Isolation**: Use different accounts for bot vs user roles
2. **Sequential Testing**: Run Steam tests sequentially to avoid rate limits
3. **Clean State**: Clear friend lists between test runs if needed
4. **Monitor Usage**: Track which accounts are used for what tests
5. **Backup Fixtures**: Keep backup copies of working maFiles

## Example Test Using Fixtures

```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('bot connects with real credentials', async ({ request }) => {
  // Parse accounts from fixtures
  const accounts = parseTestAccounts();
  const botAccount = accounts[0];
  
  // Add bot to application
  const response = await request.post('/api/bots', {
    data: {
      maFileJSON: JSON.stringify(botAccount.maFile),
      proxyUrl: botAccount.proxyUrl,
      label: 'Test Bot'
    }
  });
  
  expect(response.ok()).toBeTruthy();
  
  // Connect and verify
  const bot = await response.json();
  await request.post(`/api/bots/${bot.id}/connect`);
  
  // Wait and check status
  await page.waitForTimeout(10000);
  const status = await request.get('/api/bots');
  const connectedBot = status.find(b => b.id === bot.id);
  
  expect(connectedBot.status).toBe('connected');
});
```