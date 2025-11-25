FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
ARG NODE_ENV=prod
RUN if [ "$NODE_ENV" = "prod" ]; then npm ci --omit=dev; else npm install; fi

FROM node:18-alpine AS dev_stage
WORKDIR /app
ENV NODE_ENV=dev
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 5050
CMD ["npm", "run", "dev"]

FROM node:18-alpine AS prod_stage
WORKDIR /app
ENV NODE_ENV=prod
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 5050
CMD ["node", "server.js"]
