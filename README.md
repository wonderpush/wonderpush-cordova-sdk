# WonderPush Cordova / PhoneGap SDK

[WonderPush](https://www.wonderpush.com) is an advanced push notification service for iOS and Android applications and Websites. High volume and fast delivery. [Start for free](https://dashboard.wonderpush.com/account/signup).

This a Cordova / PhoneGap SDK.

Quick links:
* [**Getting started guide**](https://www.wonderpush.com/docs/cordova/getting-started)
* [**Latest SDK documentation**](https://wonderpush.github.io/wonderpush-cordova-sdk/)
* [**Latest API reference**](https://wonderpush.github.io/wonderpush-cordova-sdk/api.html)
* [**Demo application**](https://github.com/wonderpush/wonderpush-cordova-demo)

## Getting started

Please see [our guide](https://www.wonderpush.com/docs/cordova/getting-started) for more information.

### 1) Create your application if needed

Use cordova tool to create an application, see the [official Cordova guide](https://cordova.apache.org/docs/en/latest/guide/cli/) for more details.

```sh
cordova create cordova-demo com.wonderpush.demo WonderPushCordovaDemo
cd cordova-demo
```

Add the Android and iOS platforms:

```sh
cordova platform add android --save
cordova platform add ios --save
```

### 2) Add the WonderPush SDK

For developing the SDK itself, do this first: `npm link ../wondeprush-cordova-sdk`

```sh
cordova plugin add wonderpush-cordova-sdk --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
```

### 3) Use WonderPush SDK in your application

#### a) Notification permission and SDK initialization

On iOS, you must call the `WonderPush.subscribeToNotifications()` function at some time, preferably after presenting the user what benefit will push notifications bring to him.

The SDK initializes itself on the start of the application.
You don't need to do anything.

#### b) Use WonderPush features

See our [Cordova quickstart](https://docs.wonderpush.com/docs/cordova-quickstart) for guidance about using our features.

### 4) Test your app

```
cordova run --device
```

## Updating

```
cordova plugin update wonderpush-cordova-sdk

# If Cordova finds this insufficient, remove and re-add the plugin:
cordova plugin rm wonderpush-cordova-sdk
cordova plugin add wonderpush-cordova-sdk --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
```

## Advanced usage

### Handling your own deep links

WonderPush allows you to open a deep link with your notifications (`targetUrl` of your notification object, or set the tap/click action while composing your notification with our dashboard).
To use deep links with cordova, you can use [a plugin](https://github.com/EddyVerbruggen/Custom-URL-scheme) maintained by the community.
