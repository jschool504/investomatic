#!/bin/sh

CURRENT_TIME=$(date "+%Y.%m.%d-%H.%M.%S")

mkdir -p logs

ENV=prod NODE_TLS_REJECT_UNAUTHORIZED=0 ts-node app/server.ts > logs/$CURRENT_TIME.log &
