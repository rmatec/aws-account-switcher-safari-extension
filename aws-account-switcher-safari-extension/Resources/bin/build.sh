#!/bin/bash
set -e

echo "Preparing files for production"
resources="$SRCROOT/aws-account-switcher-safari-extension/Resources"
options="$resources/js/options.js"
popup="$resources/js/popup.js"
background="$resources/js/background.js"
supporters="$resources/js/supporters.js"

mkdir -p "$resources/js"

cp "$resources/src/content.js" "$resources/js/content.js"
cp "$resources/src/attach_target.js" "$resources/js/attach_target.js"

rollup src/options.js --file $options
rollup src/popup.js --file $popup
rollup src/background.js --file $background
rollup src/supporters.js --file $supporters

echo "Finished preparing files for production"
