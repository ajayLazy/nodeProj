#!/bin/bash

# Replace this with your process name or check logic
PROCESS_NAME="index.cjs"
WEBHOOK_URL="https://hooks.slack.com/services/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"

# Check if the process is running
if pgrep -f "$PROCESS_NAME" > /dev/null; then
    # Server is running, send Slack notification
    curl -X POST -H 'Content-type: application/json' --data "{
        \"text\": \"✅ Server ($PROCESS_NAME) is running fine!\"
    }" $WEBHOOK_URL
else
    # Server is not running, send Slack notification
    curl -X POST -H 'Content-type: application/json' --data "{
        \"text\": \"❗ Server ($PROCESS_NAME) is down!\"
    }" $WEBHOOK_URL
fi
