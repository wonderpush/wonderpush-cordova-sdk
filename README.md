# wonderpush-cordova-sdk
Cordova SDK for WonderPush − Notifications &amp; Analytics
(Not for production yet)

## Getting started
This guide is a draft, please see our [Android guide](http://www.wonderpush.com/docs/android/getting-started) for more details (CLIENT_ID, CLIENT_SECRET ... ).
#### 1) Create your application if needed
Use cordova tool to create an application, see [cordova guide](https://cordova.apache.org/docs/en/latest/guide/cli/) for more details
```
cordova create cordova-demo com.wonderpush.cordova.demo WonderPushCordovaDemo
```
Then go to your newly created folder, in our case `cd cordova-demo`

Add android platform
```
cordova platform add android --save
```
#### 2) Add the wonderpush sdk
```
cordova plugin add --save cordova-plugin-wonderpush --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
```
For development 
```
cordova plugin add --save --link path-to-wonderpush-sdk-folder --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
```

#### 3) Configure your platforms
##### a) For android: Add gradle config to your gradle file.
```
android {
  defaultConfig {
    manifestPlaceholders = [
      wonderpushDefaultActivity:  'YOUR_MAIN_ACTIVITY_CLASS',
      wonderpushNotificationIcon: 'YOUR_NOTIFICATION_ICON'
    ]
  }
}
```
For example, you can add the above config in `platforms/android/build-extras.gradle`

YOUR_MAIN_ACTIVITY_CLASS in our example is `com.wonderpush.cordova.demo.MainActivity`
YOUR_NOTIFICATION_ICON can be `@drawable/icon`

#### 4) Use WonderPush sdk in your application
##### a) Initialize the sdk
You must initialize the sdk before using it. A good place to add the code is in `onDeviceReady`, normally in `www/js/index.js`.
```
cordova.plugins.WonderPush.initialize()
```
##### b) Use WonderPush features
See our [Android guide: Using the SDK in your Android application](http://www.wonderpush.com/docs/android/getting-started) for guidance about using our features. These methods do the same thing as in Android version.
- cordova.plugins.WonderPush.trackEvent
- cordova.plugins.WonderPush.putInstallationCustomProperties
- cordova.plugins.WonderPush.setNotificationEnabled

#### 5) Test your app
```
cordova run --device
```

## Advanced usage
#### Handling your own deep links
WonderPush allows you to open a deep link with your notifications (`targetUrl` of your notification object, or set the tap/click action while composing your notification with our dashboard). To use deep links with cordova, you can use [a plugin](https://github.com/EddyVerbruggen/Custom-URL-scheme) maintained by the community.
