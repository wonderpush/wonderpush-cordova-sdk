#!/bin/bash
# vim: ts=4 sts=4 sw=4 et

mkdir -p src/ios
git submodule update
cd wonderpush-ios-sdk
pod install
xcodebuild -project Pods/Pods.xcodeproj -scheme WonderPush
xcodebuild -project Pods/Pods.xcodeproj -scheme WonderPushExtension
find build -type d -name '*.framework' | while read f; do
	basename "$f"
	rm -Rf ../src/ios/"$(basename "$f")"/
	cp -r "$f" ../src/ios/
done
