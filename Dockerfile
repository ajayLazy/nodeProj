ARG NODE_VERSION=14.21.3

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app

# Install the application's dependencies and necessary packages
RUN apk update && apk add --no-cache curl tini cron

# Install PM2 globally inside the container
RUN npm install -g pm2

# Copy package.json and package-lock.json (if available)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the source files into the image.
COPY . .
COPY entrypoint.sh /usr/local/bin/
COPY mycron /etc/cron.d/

# Give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/mycron

# Apply cron job
RUN crontab /etc/cron.d/mycron

# Expose the port that the application listens on.
EXPOSE 3005

# Run the application as a non-root user.
USER node

# Run the application using PM2 runtime
CMD ["tini", "--", "pm2-runtime", "start", "index.cjs"]