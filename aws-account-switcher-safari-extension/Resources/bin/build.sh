#!/bin/bash
#--
# build.sh
#--

set -e

resources="$SRCROOT/aws-account-switcher-safari-extension/Resources"
options="$resources/js/options.js"
popup="$resources/js/popup.js"
background="$resources/js/background.js"

mkdir -p "$resources/js"

cp "$resources/src/content.js" "$resources/js/content.js"
cp "$resources/src/attach_target.js" "$resources/js/attach_target.js"

cat "$resources/src/lib/load_aws_config.js"         > "$options"
cat "$resources/src/lib/color_picker.js"           >> "$options"
cat "$resources/src/lib/data_profiles_splitter.js" >> "$options"
cat "$resources/src/lib/lz-string.min.js"          >> "$options"
cat "$resources/src/options.js"                    >> "$options"

cat "$resources/src/lib/profile_set.js"            >  "$popup"
cat "$resources/src/lib/data_profiles_splitter.js" >> "$popup"
cat "$resources/src/popup.js"                      >> "$popup"

cat "$resources/src/lib/data_profiles_splitter.js"  > "$background"
cat "$resources/src/lib/load_aws_config.js"        >> "$background"
cat "$resources/src/lib/lz-string.min.js"          >> "$background"
cat "$resources/src/background.js"                 >> "$background"
