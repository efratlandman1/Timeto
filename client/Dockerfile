# Use the official Node.js image for building the React app
FROM node:18 AS build_stage

# Create and set the working directory with correct permissions
WORKDIR /app
RUN mkdir -p /app && chown -R node:node /app

# Switch to the 'node' user
USER node

# Copy files with the correct ownership
COPY --chown=node:node package*.json ./

# Install dependencies
RUN npm install

# Copy source code with correct ownership
COPY --chown=node:node . .

# Define build argument for environment (default is production)
ARG NODE_ENV=dev
ENV NODE_ENV=${NODE_ENV}

# Conditionally run the React build for production
RUN if [ "$NODE_ENV" = "prod" ]; then npm run build; fi

# Development stage
FROM node:18 AS dev_stage

WORKDIR /app
RUN mkdir -p /app && chown -R node:node /app
USER node

# Copy files and install dependencies
COPY --chown=node:node package*.json ./
RUN npm install

# Copy remaining files
COPY --chown=node:node . .

EXPOSE 80

# Start React development server on port 80
CMD ["sh", "-c", "PORT=80 npm start"]

# Production stage
FROM nginx:alpine AS prod_stage

COPY --from=build_stage /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
