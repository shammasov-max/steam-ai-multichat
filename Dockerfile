FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
COPY .yarn ./.yarn
COPY .yarnrc.yml ./

RUN yarn install --frozen-lockfile

COPY . .

RUN npx prisma generate
RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]