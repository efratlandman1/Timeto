# Dependency layer for caching
FROM node:18 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage for production assets
FROM node:18 AS build_stage
WORKDIR /app
ENV NODE_ENV=prod
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY . .
RUN npm run build

# Development stage runs the React dev server
FROM node:18 AS dev_stage
WORKDIR /app
ENV NODE_ENV=dev
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY . .
EXPOSE 80
CMD ["sh", "-c", "PORT=${PORT:-80} npm start"]

# Production stage serves the static build via nginx
FROM nginx:alpine AS prod_stage
COPY --from=build_stage /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
