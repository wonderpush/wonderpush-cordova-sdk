# wonderpush-cordova-sdk

Cordova SDK for WonderPush − Notifications &amp; Analytics

## Getting started

This guide is a draft, please see our [Android guide](https://www.wonderpush.com/docs/android/getting-started) and [iOS guide](https://www.wonderpush.com/docs/ios/getting-started) for more details (CLIENT_ID, CLIENT_SECRET…).

### 1) Create your application if needed

Use cordova tool to create an application, see [cordova guide](https://cordova.apache.org/docs/en/latest/guide/cli/) for more details.

```
cordova create cordova-demo com.wonderpush.demo WonderPushCordovaDemo
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

#### a) For Android: Add gradle config to your gradle file.

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

#### b) For iOS: (Recommended) Support rich notifications

In order to use rich notifications, you must add a Notification Service Extension to your project and let the WonderPush SDK do the hard work for you.

First, let’s add the new application extension to your project:

1. Open `platforms/ios/YourApplication.xcworkspace` in XCode.
2. Open the XCode _File_ menu, under _New_ select _Target…_.
3. In the _iOS_ tab, in the _Application Extension_ group, select _Notification Service Extension_ and click _Next_.
4. Give it a name you like, here we soberly chose _NotificationServiceExtension_.
   Choose the same team as your application target.
   Make sure that it is linked to your project and embedded in your application, in the bottom.
   Click _Finish_.
5. XCode will ask you whether you want to activate the new scheme. Click _Cancel_.

Let's fix a signing issue:

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _General_ tab, Under _Signing_ select your _Team_ if necessary.
4. If you see the following issue: `Provisioning profile "iOS Team Provisioning Profile: com.mycompany.*" doesn't include the aps-environment entitlement.`, under _Identity_ edit  _Bundle identifier_ to match your app bundle identifier: `com.mycompany.myapp`.

Add the necessary WonderPushExtension framework to the target:

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _General_ tab, under _Linked Frameworks and Libraries_ click the _+_ button.
4. Click _Add other…_.
5. Navigate to your project root directory then under _platforms/ios/MyApp/Plugins/wonderpush-cordova-sdk/_ and select _WonderPushExtension.framework_.
6. Click _Open_.

Let's fix a path issue:

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _Build settings_ tab, under _Search Paths_, double click on the cell with bold text (potentially on a green background).
4. In the values list, find `$(PROJECT_DIR)/YourApp/Plugins/wonderpush-cordova-sdk` and replace it with `Yourapp/Plugins/wonderpush-cordova-sdk`.
5. Click outside the popup to validate your input. (Pressing Enter then Escape to close the popup dismisses your changes.)

You should see the following files in your Project navigator:

* `YourApp`
  * `NotificationServiceExtension` (this is the name of the service extension you chose earlier)
    * `NotificationService.h`
    * `NotificationService.m`
    * `Info.plist`

We are going to remove almost all generated code to rely on a utility class the implements it all for you.

Open `NotificationService.h` and modify it so that it reads:

```objc
#import <WonderPushExtension/NotificationServiceExtension.h>

// We delegate everything to WPNotificationService
@interface NotificationService : WPNotificationService

@end
```

Then open `NotificationService.m` and modify it so that it reads:

```objc
#import "NotificationService.h"

@implementation NotificationService

// The WPNotificationService superclass already implements everything

@end
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
