#!/bin/bash
set -e

echo "Updating build number in ${PROJECT_DIR}/${INFOPLIST_FILE}"
buildNumber=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${PROJECT_DIR}/${INFOPLIST_FILE}")
echo "Current build: $buildNumber"
buildNumber=$(($buildNumber + 1))
echo "Setting build number to $buildNumber"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $buildNumber" "${PROJECT_DIR}/${INFOPLIST_FILE}"
