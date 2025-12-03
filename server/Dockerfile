FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (אם יש)
COPY package*.json ./

# Install ALL dependencies (כולל nodemon ו-google-auth-library)
RUN npm install

# Copy the rest of the app
COPY . .

# Optional: change ownership
RUN chown -R node:node /app

# Use non-root user
USER node

# Expose the server port
EXPOSE 5050

# Start with nodemon
CMD ["npx", "nodemon", "server.js"]
