ARG NODE_VERSION=14.21.3

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app

# Install the application's dependencies and necessary packages
RUN apk update && apk add --no-cache curl tini cron
COPY package.json package-lock.json ./
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

# Run the application.
CMD ["tini", "--", "/usr/local/bin/entrypoint.sh"]
