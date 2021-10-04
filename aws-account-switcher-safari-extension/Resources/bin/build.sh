#!/bin/bash
set -e

echo "Preparing files for production"
resources="$SRCROOT/aws-account-switcher-safari-extension/Resources"
options="$resources/js/options.js"
popup="$resources/js/popup.js"
background="$resources/js/background.js"

mkdir -p "$resources/js"

cp "$resources/src/content.js" "$resources/js/content.js"
cp "$resources/src/attach_target.js" "$resources/js/attach_target.js"

rollup "$resources/src/options.js" --file $options
rollup "$resources/src/popup.js" --file $popup
rollup "$resources/src/background.js" --file $background

echo "Finished preparing files for production"
