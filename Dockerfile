ARG NODE_VERSION=14.21.3

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app

# Install the application's dependencies and necessary packages
RUN apk update && apk add --no-cache curl tini cron

# Install PM2 globally
RUN npm install -g pm2

# Copy package.json and package-lock.json (if available)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 3005

# Run the application as a non-root user.
USER node

# Use PM2 to run the index.cjs file
CMD ["pm2-runtime", "start", "index.cjs"]
