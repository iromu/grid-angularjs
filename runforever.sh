#!/usr/bin/env bash
cd dist

NODE_ENV=production \
PORT=8080 \
APP_UID="grid-angular-01" \
forever start --uid "grid-angular-01" -w -a server/app.js

NODE_ENV=production \
PORT=8081 \
APP_UID="grid-angular-02" \
forever start --uid "grid-angular-02" -w -a server/app.js

