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

#### a) For iOS: Add Push Notifications capability

If you've just created your project, before we open XCode, make sure to build the project once so that things like Signing identities are properly set:

```
cordova build
```

First, let’s add the new application extension to your project:

1. Open `platforms/ios/YourApplication.xcworkspace` in XCode.
2. In the Project navigator, select your project.
3. Select your application target.
4. In the _Capabilities_ tab, flip the _Push Notifications_ switch on.

This step could be done automatically without causing problems building the Notification Service Extension with Cordova of the next step.

#### b) For iOS: (Recommended) Support rich notifications

In order to use rich notifications, you must add a Notification Service Extension to your project and let the WonderPush SDK do the hard work for you.

First, let’s add the new application extension to your project:

1. Open `platforms/ios/YourApplication.xcworkspace` in XCode.
2. Open the XCode _File_ menu, under _New_ select _Target…_.
3. In the _iOS_ tab, in the _Application Extension_ group, select _Notification Service Extension_ and click _Next_.
4. Give it a name you like, here we soberly chose _NotificationServiceExtension_.
   Choose the same team as your application target.
   Make sure that it is linked to your project instead of `CordovaLib`, and next that it's embedded in your application.
   Click _Finish_.
5. XCode will ask you whether you want to activate the new scheme. Click _Cancel_.
   If you inadvertently clicked _Activate_, simply select your application in the scheme selector next to the run/stop buttons.

Let's fix a signing issue:

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _General_ tab, under _Signing_ select your _Team_ if necessary.

Make sure the extension runs on any iOS 10.0 or ulterior devices:

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _General_ tab, under _Deployment Info_ set _Deployment Target_ to `10.0`.

Add the necessary WonderPushExtension framework to the target:

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _General_ tab, under _Linked Frameworks and Libraries_ click the _+_ button.
4. Click _Add Other…_.
5. Navigate to your project root directory then under _platforms/ios/MyApp/Plugins/wonderpush-cordova-sdk/_ and select _WonderPushExtension.framework_.
6. Click _Open_.

Let's fix a path issue:

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _Build settings_ tab, under _Search Paths_ on the _Framework Search Paths_ line, double click on the cell with bold text (potentially on a green background).
4. In the values list, find `$(PROJECT_DIR)/YourApp/Plugins/wonderpush-cordova-sdk` and drop `$(PROJECT_DIR)/` at the beginning so it becomes `Yourapp/Plugins/wonderpush-cordova-sdk`.
5. Click outside the popup to validate your input. (Pressing Enter then Escape to close the popup dismisses your changes.)

Now we'll need to remove a Cordova configuration that leaks from the application's target to the extension target: 

1. In the Project navigator, select your project.
2. Select your new target.
3. In the _Build settings_ tab, under _Signing_ on the _Code Signing Entitlements_ group, double click the cell corresponding to your extension target and remove values for both the _Debug_ and _Release_ entries so that they are empty.

We're done with the configuration, now on with a bit of code.

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

Test that cordova can still build your project from command-line:

```
cordova build
```

If you see an error in the step `Check dependencies` for the Notification Service Extension target, then open `platforms/ios/cordova/build.xcconfig` and add `//` at the begining of the following line so that it reads:

```
// (CB-11854)
//CODE_SIGN_ENTITLEMENTS = $(PROJECT_DIR)/$(PROJECT_NAME)/Entitlements-$(CONFIGURATION).plist
```

Now your project builds fine with either Cordova CLI or XCode.

##### Troubleshooting missing media attachments

We have noticed that, after running an application using XCode, when running with Cordova after that can lead to media attachments not being shown in the notifications.

The error that you can see in your device logs is as follows: (NB: not your application logs, open XCode, menu _Window_, click _Devices and Simulators_, choose your device and in the bottom of the main part, click the upward triangle in a square whose tooltip reads _Show the device console_)

```
kernel(Sandbox)[0] <Notice>: SandboxViolation: NotificationServ(4385) deny(1) file-write-create /private/var/mobile/Containers/Data/PluginKitPlugin/73E48A8F-696D-460C-AEB8-BD83674DD158
NotificationServiceExtension(Foundation)[4385] <Info>: Write options: 0 -- URL: <private> -- purposeID: DCB02E0E-CA64-41B9-B99D-D37BC87C6A2E
filecoordinationd(Foundation)[179] <Notice>: Received claim <private>
filecoordinationd(Foundation)[179] <Info>: Starting to observe state of client with pid 4385 on behalf of claim DEA8C7A2-5479-4822-8586-A49E26FB214F
filecoordinationd(Foundation)[179] <Notice>: Claim DEA8C7A2-5479-4822-8586-A49E26FB214F granted in server
filecoordinationd(Foundation)[179] <Notice>: Claim DEA8C7A2-5479-4822-8586-A49E26FB214F invoked in server
NotificationServiceExtension(Foundation)[4385] <Notice>: Claim DEA8C7A2-5479-4822-8586-A49E26FB214F granted in client
NotificationServiceExtension(Foundation)[4385] <Notice>: Claim DEA8C7A2-5479-4822-8586-A49E26FB214F invoked in client
filecoordinationd(Foundation)[179] <Notice>: Claim DEA8C7A2-5479-4822-8586-A49E26FB214F was revoked
NotificationServiceExtension(WonderPushExtension)[4385] <Notice>: [WonderPush] Failed to write attachment to disk: Error Domain=NSCocoaErrorDomain Code=4 "The folder \M-b\M^@\M^\0.jpg\M-b\M^@\M^] doesn\M-b\M^@\M^Yt exist." UserInfo={NSURL=file:///private/var/mobile/Containers/Data/PluginKitPlugin/73E48A8F-696D-460C-AEB8-BD83674DD158/0.jpg, NSUnderlyingError=0x1762e4b0 {Error Domain=NSPOSIXErrorDomain Code=2 "No such file or directory"}, NSUserStringVariant=Folder}
```

While the actual cause stay a mystery for us, the solution is simple: uninstall your application, and run it again using Cordova.

### 4) Use WonderPush SDK in your application

#### a) Notification permission and SDK initialization

On iOS, you must call the `cordova.plugins.WonderPush.setNotificationEnabled(true)` function at some time, preferably after presenting the user what benefit will push notifications bring to him.

The SDK initializes itself on the start of the application.
You don't need to do anything.

On Android it declares a custom `Application` class.
If you already are using your own, be sure to call `WonderPush.initialize(this);` inside your implementation.

On iOS it watches for the `UIApplicationDidFinishLaunchingNotification` notification in the `NSNotificationCenter`.

#### b) Use WonderPush features

See our [Android guide: Using the SDK in your Android application](https://www.wonderpush.com/docs/android/getting-started#android-getting-started-using-sdk) or [iOS guide: Using the SDK in your iOS application](https://www.wonderpush.com/docs/ios/getting-started#ios-getting-started-using-sdk) for guidance about using our features.

These methods do the same thing as in the Android/iOS version:

- `cordova.plugins.WonderPush.setUserId`
- `cordova.plugins.WonderPush.setNotificationEnabled`
- `cordova.plugins.WonderPush.trackEvent`
- `cordova.plugins.WonderPush.getInstallationCustomProperties`
- `cordova.plugins.WonderPush.putInstallationCustomProperties`

### 5) Test your app

```
cordova run --device
```

## Updating

```
cordova plugin remove wonderpush-cordova-sdk

cordova plugin add --save wonderpush-cordova-sdk --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
// OR for development
cordova plugin add --save --link ../wonderpush-cordova-sdk --variable CLIENT_ID='id' --variable CLIENT_SECRET='secret'
```

Recheck all integration steps, including for the Notification Service Extension, especially:

* Adding the necessary WonderPushExtension framework to the target
* Fix a path issue

## Advanced usage

### Handling your own deep links

WonderPush allows you to open a deep link with your notifications (`targetUrl` of your notification object, or set the tap/click action while composing your notification with our dashboard).
To use deep links with cordova, you can use [a plugin](https://github.com/EddyVerbruggen/Custom-URL-scheme) maintained by the community.
