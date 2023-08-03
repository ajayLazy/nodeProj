#!/bin/sh

# Start cron daemon in the background
crond -l 2 -b

# Continue with your CMD command (starting the app)
npm run back
