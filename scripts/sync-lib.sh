#!/bin/sh
# Copies the Plagx Preflight core from the sibling plagx-preflight repo into the app.
set -e
cd "$(dirname "$0")/.."
cp ../plagx-preflight/src/*.js src/lib/
echo "Synced: $(grep -o "VERSION = '[^']*'" src/lib/index.js)"
