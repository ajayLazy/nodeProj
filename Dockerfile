ARG NODE_VERSION=14.21.3

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production

WORKDIR /usr/src/app

# Copy package.json and package-lock.json for installing dependencies
COPY package.json package-lock.json ./

# Install the application's dependencies
RUN npm ci --omit=dev

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 3005

# Run the application as a non-root user.
USER node

# Run the application.
CMD npm run back
