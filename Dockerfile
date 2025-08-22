FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/steam-agent/package.json ./packages/steam-agent/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Generate Prisma client and build
RUN pnpm exec prisma generate
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]