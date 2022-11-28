#!/bin/sh

echo "Installing dependencies..."

echo "installing nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

echo "nvm installed."

echo "installing jq, build-essential, make..."
apt-get install jq build-essentials make
echo "jq, build-essential, make installed."

NODE_VERSION=$(cat ~/package.json | jq .engines.node | tr -d '"')

echo "installing node..."
nvm install $NODE_VERSION

nvm use $NODE_VERSION

echo "node installed."

echo "installing node_modules..."
npm install
echo "node_modules installed."

echo "Setup completed."