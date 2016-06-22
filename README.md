# wonderpush-cordova-sdk
Cordova SDK for WonderPush − Notifications &amp; Analytics

## Getting started
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

#### 3) Configure your platforms
##### a) For android: Add grade config to your gradle file.
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
- cordova.plugins.WonderPush.trackEvent
- cordova.plugins.WonderPush.putInstallationCustomProperties
- cordova.plugins.WonderPush.setNotificationEnabled

#### 5) Test your app
```
cordova run --device
```
