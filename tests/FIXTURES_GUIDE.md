# Test Fixtures Quick Guide

## Account Format in `fixtures/all.txt`
```
username:password - proxyHost:proxyPort:proxyUser:proxyPass
```

## Parse Accounts
```typescript
const fixturesPath = 'fixtures/all.txt';
const lines = fs.readFileSync(fixturesPath, 'utf-8').split('\n');

lines.forEach(line => {
  const match = line.match(/^(.+?):(.+?)\s+-\s+(.+?):(\d+):(.+?):(.+?)$/);
  if (match) {
    const [, username, password, proxyHost, proxyPort, proxyUser, proxyPass] = match;
    const maFile = JSON.parse(fs.readFileSync(`fixtures/mafile/${username}.maFile`, 'utf-8'));
    const proxyUrl = `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;
    // Use account...
  }
});
```

## Use in Tests

**As Bot (server-side):**
```typescript
await request.post('/api/bots', {
  data: {
    maFileJSON: JSON.stringify(account.maFile),
    proxyUrl: account.proxyUrl,
    label: `Bot - ${account.username}`
  }
});
```

**As User (client-side):**
```typescript
const userAgent = createSteamAgent({
  maFile: account.maFile,
  password: account.password,
  userName: account.username,
  proxy: account.proxyUrl
});
```

## Available Accounts (10 total)
- Use different accounts for bot vs user roles
- Rate limit: 1 friend invite/minute per account
- Each has maFile in `fixtures/mafile/{username}.maFile`

## Key Points
- maFile contains Steam auth tokens (shared_secret, identity_secret)
- Proxy required for each account to avoid IP bans
- Run tests sequentially to respect Steam rate limits