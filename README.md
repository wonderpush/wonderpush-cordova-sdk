# wonderpush-cordova-sdk

Cordova SDK for WonderPush − Notifications &amp; Analytics

## Getting started

This guide is a draft, please see our [Android guide](https://www.wonderpush.com/docs/android/getting-started) and [iOS guide](https://www.wonderpush.com/docs/ios/getting-started) for more details (CLIENT_ID, CLIENT_SECRET…).

### 1) Create your application if needed

Use cordova tool to create an application, see [cordova guide](https://cordova.apache.org/docs/en/latest/guide/cli/) for more details.

```
cordova create cordova-demo com.wonderpush.cordova.demo WonderPushCordovaDemo
cd cordova-demo
```

Add the Android and iOS platforms:

```
cordova platform add android --save
cordova platform add ios --save
```

### 2) Add the WonderPush SDK

```
cordova plugin add --save wonderpush-cordova-sdk --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
```

For development:

```
cordova plugin add --save --link ../wonderpush-cordova-sdk --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
```

### 3) Configure your platforms

#### a) For android: Add gradle config to your gradle file.

Edit your `platforms/android/build-extras.gradle`:

```
android {
  defaultConfig {
    manifestPlaceholders = [
      wonderpushDefaultActivity:  'YOUR_MAIN_ACTIVITY_CLASS', // eg. 'com.myapp.MainActivity'
      wonderpushNotificationIcon: 'YOUR_NOTIFICATION_ICON'    // eg. '@drawable/icon'
    ]
  }
}
```

### 4) Use WonderPush SDK in your application

#### a) Initialize the SDK

You must initialize the sdk before using it. A good place to add the code is in `onDeviceReady`, normally in `www/js/index.js`.

```
cordova.plugins.WonderPush.initialize()
```

#### b) Use WonderPush features

See our [Android guide: Using the SDK in your Android application](https://www.wonderpush.com/docs/android/getting-started#android-getting-started-using-sdk) or [iOS guide: Using the SDK in your iOS application](https://www.wonderpush.com/docs/ios/getting-started#ios-getting-started-using-sdk) for guidance about using our features.

These methods do the same thing as in the Android/iOS version:

- cordova.plugins.WonderPush.trackEvent
- cordova.plugins.WonderPush.putInstallationCustomProperties
- cordova.plugins.WonderPush.setNotificationEnabled

### 5) Test your app

```
cordova run --device
```

## Advanced usage

### Handling your own deep links

WonderPush allows you to open a deep link with your notifications (`targetUrl` of your notification object, or set the tap/click action while composing your notification with our dashboard).
To use deep links with cordova, you can use [a plugin](https://github.com/EddyVerbruggen/Custom-URL-scheme) maintained by the community.
