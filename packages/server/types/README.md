# Custom Type Definitions

This directory contains ambient TypeScript declarations for third-party libraries that don't have official `@types` packages on DefinitelyTyped.

## Available Types

- **`machine-uuid.d.ts`** - Type definitions for the `machine-uuid` library
- **`steam-client.d.ts`** - Basic type definitions for the `steam-client` library
- **`fastq.d.ts`** - Type definitions for the `fastq` work queue library
- **`generate-password.d.ts`** - Type definitions for the `generate-password` library

## Installed @types Packages

The following @types packages were installed via npm and are available automatically:

- `@types/steam-user` - TypeScript definitions for steam-user
- `@types/steamcommunity` - TypeScript definitions for steamcommunity  
- `@types/steam-totp` - TypeScript definitions for steam-totp
- `@types/steamid` - TypeScript definitions for steamid
- `@types/request` - TypeScript definitions for request

## Libraries with Built-in Types

- **`steam-session`** - Already includes its own TypeScript definitions

## TypeScript Configuration

The `tsconfig.json` has been updated with:

```json
{
  "compilerOptions": {
    "typeRoots": ["types", "node_modules/@types"]
  }
}
```

This ensures TypeScript will look for type definitions in both our custom `types/` directory and the standard `node_modules/@types/` directory.
