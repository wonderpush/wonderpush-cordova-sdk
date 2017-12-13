/*
 Copyright 2014 WonderPush

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <CoreBluetooth/CoreBluetooth.h>
#import <UserNotifications/UserNotifications.h>

FOUNDATION_EXPORT double WonderPushVersionNumber;
FOUNDATION_EXPORT const unsigned char WonderPushVersionString[];


/**
 Name of the notification that is sent using `NSNotificationCenter` when the SDK is initialized.
 */
#define WP_NOTIFICATION_INITIALIZED @"_wonderpushInitialized"

/**
 Name of the notification that is sent using `NSNotificationCenter` when a user logs in.
 */
#define WP_NOTIFICATION_USER_LOGED_IN @"_wonderpushUserLoggedIn"

/**
 Key of the SID parameter for `WP_NOTIFICATION_USER_LOGED_IN` notification.
 */
#define WP_NOTIFICATION_USER_LOGED_IN_SID_KEY @"_wonderpushSID"

/**
 Key of the Access Token parameter for `WP_NOTIFICATION_USER_LOGED_IN` notification.
 */
#define WP_NOTIFICATION_USER_LOGED_IN_ACCESS_TOKEN_KEY @"_wonderpushAccessToken"

/**
 Key of the parameter used when a button of type `method` is called.
 */
#define WP_REGISTERED_CALLBACK_PARAMETER_KEY @"_wonderpushCallbackParameter"

/**
 Name of the notification that is sent using `NSNotificationCenter` when a push notification with a "delegate to application code" deep link.
 */
#define WP_NOTIFICATION_OPENED_BROADCAST @"_wonderpushNotificationOpenedBroadcast"

/**
 The `WonderPushDelegate` protocol lets you customize various aspects of the WonderPush behavior at runtime.
 */
@protocol WonderPushDelegate <NSObject>

/**
 Lets you overwrite URLs that WonderPush will open using `UIApplication:openURL:`.
 @param URL The URL that WonderPush is about to open.
 @return A URL to open, or nil to avoid opening anything. Just return the value of the URL parameter to use the default WonderPush behavior.
 */
@optional
- ( NSURL * ) wonderPushWillOpenURL:( NSURL * )URL;
@end

/**
 `WonderPush` is your main interface to the WonderPush SDK.

 Make sure you properly installed the WonderPush SDK, as described in [the guide](../index.html).

 You must call `<setClientId:secret:>` before using any other method.

 You must also either call `<setupDelegateForApplication:>`, preferably in the `application:willFinishLaunchingWithOptions:` method of your `AppDelegate` just after calling the previously mentioned method, or override every method listed under [Manual AppDelegate forwarding](#task_Manual AppDelegate forwarding).

 You must also either call `<setupDelegateForUserNotificationCenter>`, preferably along with `<setupDelegateForApplication:>` in the `application:willFinishLaunchingWithOptions:` method of your `AppDelegate`, or override every method listed under [Manual UserNotificationCenter delegate forwarding](#task_Manual UserNotificationCenter delegate forwarding).

 Troubleshooting tip: As the SDK should not interfere with your application other than when a notification is to be shown, make sure to monitor your logs for WonderPush output during development, if things did not went as smoothly as they should have.
 */
@interface WonderPush : NSObject

///---------------------
/// @name Initialization
///---------------------

/**
 Initializes the WonderPush SDK.

 Initialization should occur at the earliest possible time, when your application starts.
 A good place is the `application:didFinishLaunchingWithOptions:` method of your `AppDelegate`.

 Please refer to the step entitled *Initialize the SDK* from [the guide](../index.html).

 @param clientId Your WonderPush client id
 @param secret Your WonderPush client secret
 */
+ (void) setClientId:(NSString *)clientId secret:(NSString *)secret;

/**
 Sets the user id, used to identify a single identity across multiple devices, and to correctly identify multiple users on a single device.

 If not called, the last used user id it assumed. Defaulting to `nil` if none is known.

 Prefer calling this method just before calling `<setClientId:secret:>`, rather than just after.
 Upon changing userId, the access token is wiped, so avoid unnecessary calls, like calling with null just before calling with a user id.

 @param userId The user id, unique to your application. Use `nil` for anonymous users.
     You are strongly encouraged to use your own unique internal identifier.
 */
+ (void) setUserId:(NSString *)userId;

/**
 Sets the delegate for the WonderPushSDK. Setting the delegate lets you control various behaviors of the WonderPushSDK at runtime.
 It is advised to set the delegate as early as possible, preferably in application:didFinishLaunchingWithOptions
 @param delegate The delegate.
 */
+ (void) setDelegate:(__weak id<WonderPushDelegate>) delegate;

/**
 Returns whether the WonderPush SDK has been given the clientId and clientSecret.
 Will be `YES` as soon as `[WonderPush setClientId:secret:]` is called.
 No network can be performed before the SDK is initialized.
 Further use of the SDK methods will be dropped until initialized. Such call will be ignored and logged in the device console.
 @return The initialization state as a BOOL
 */
+ (BOOL) isInitialized;

/**
 Returns whether the WonderPush SDK is ready to operate.
 Returns YES when the WP_NOTIFICATION_INITIALIZED is sent.
 @return The initialization state as a BOOL
 */
+ (BOOL) isReady;

/**
 Controls SDK logging.

 @param enable Whether to enable logs.
 */
+ (void) setLogging:(BOOL)enable;


///-----------------------
/// @name Core information
///-----------------------

/**
 Returns the userId currently in use, `nil` by default.
 */
+ (NSString *) userId;

/**
 Returns the installationId identifying your application on a device, bond to a specific userId.
 If you want to store this information on your servers, keep the corresponding userId with it.
 Will return `nil` until the SDK is properly initialized.
 */
+ (NSString *) installationId;

/**
 Returns the unique device identifier.
 */
+ (NSString *) deviceId;

/**
 Returns the push token, or device token in Apple lingo.
 Returns `nil` if the user is not opt-in.
 */
+ (NSString *) pushToken;

/**
 Returns the currently used access token.
 Returns `nil` until the SDK is properly initialized.
 This together with your client secret gives entire control to the current installation and associated user,
 you should not disclose it unnecessarily.
 */
+ (NSString *) accessToken;


///---------------------------------
/// @name Push Notification handling
///---------------------------------

/**
 Returns whether the notifications are enabled.

 Defaults to NO as notifications are opt-in on iOS.
 */
+ (BOOL) getNotificationEnabled;

/**
 Activates or deactivates the push notification on the device (if the user accepts) and registers the device token with WondePush.

 You **must** call the following method at least once to make the user pushable.

 - You can call this method multiple times. The user is only prompted for permission by iOS once.
 - Calling with `YES` opts the user in, whether he was not opt-in or soft opt-out (by calling with `NO`).
 - There is no need to call this method if the permission has already been granted, but it does not harm either.
   Prior to WonderPush iOS SDK v1.2.1.0, you should call it if the user was already opt-in in a non WonderPush-enabled version of your application.
 - If the permission has been denied, calling this method cannot opt the user back in as iOS leaves the user in control, through the system settings.

 Because you only have *one* chance for prompting the user, you should find a good timing for that.
 For a start, you can systematically call it when the application starts, so that the user will be prompted directly at the first launch.

 @param enabled The new activation state of push notifications.
 */
+ (void) setNotificationEnabled:(BOOL)enabled;

/**
 Returns whether the given notification is to be consumed by the WonderPush SDK.

 @param userInfo The notification dictionary as read from some UIApplicationDelegate method parameters.
 */
+ (BOOL) isNotificationForWonderPush:(NSDictionary *)userInfo;

/**
 Returns whether the notification is a `data` notification sent by WonderPush.

 Data notifications are aimed at providing your application with some data your should consume accordingly.

 @param userInfo The notification dictionary as read from some UIApplicationDelegate method parameters.
 */
+ (BOOL) isDataNotification:(NSDictionary *)userInfo;


///-----------------------------------
/// @name Installation data and events
///-----------------------------------

/**
 Returns the latest known custom properties attached to the current installation object stored by WonderPush.
 */
+ (NSDictionary *) getInstallationCustomProperties;

/**
 Updates the custom properties attached to the current installation object stored by WonderPush.

 In order to remove a value, don't forget to use `[NSNull null]` as value.

 @param customProperties The partial object containing only the custom properties to update.

 The keys should be prefixed according to the type of their values.
 You can find the details in the [Concepts > Custom fields](https://www.wonderpush.com/docs/guide/custom-fields) section of the documentation.
 */
+ (void) putInstallationCustomProperties:(NSDictionary *)customProperties;

/**
 Send an event to be tracked to WonderPush.

 @param type The event type, or name. Event types starting with an `@` character are reserved.
 */
+ (void) trackEvent:(NSString*)type;

/**
 Send an event to be tracked to WonderPush.

 @param type The event type, or name. Event types starting with an `@` character are reserved.
 @param data A dictionary containing custom properties to be attached to the event.
 Prefer using a few custom properties over a plethora of event type variants.

 The keys should be prefixed according to the type of their values.
 You can find the details in the [Concepts > Custom fields](https://www.wonderpush.com/docs/guide/custom-fields) section of the documentation.
 */
+ (void) trackEvent:(NSString*)type withData:(NSDictionary *)data;


///---------------------------------------
/// @name Automatic AppDelegate forwarding
///---------------------------------------

/**
 Setup UIApplicationDelegate override, so that calls from your UIApplicationDelegate are automatically transmitted to the WonderPush SDK.

 This eases your setup, you can call this from your
 `- (BOOL)application:(UIApplication *)application willFinishLaunchingWithOptions:(NSDictionary *)launchOptions` method.

 Do not forget to also setup the UserNotificationCenter delegate with `[WonderPush setupDelegateForUserNotificationCenter]`.

 @param application The application parameter from your AppDelegate.
 */
+ (void) setupDelegateForApplication:(UIApplication *)application;


///------------------------------------
/// @name Manual AppDelegate forwarding
///------------------------------------

/**
 Forwards an application delegate to the SDK.

 Method to call in your `application:didFinishLaunchingWithOptions:` method of your `AppDelegate`.

 @param application Same parameter as in the forwarded delegate method.
 @param launchOptions Same parameter as in the forwarded delegate method.
 */
+ (BOOL) application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions;

/**
 Forwards an application delegate to the SDK.

 Method to call in your `application:didReceiveRemoteNotification:` method of your `AppDelegate`.

 @param application Same parameter as in the forwarded delegate method.
 @param userInfo Same parameter as in the forwarded delegate method.
 */
+ (void) application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo;

/**
 Forwards an application delegate to the SDK.

 Method to call in your `application:didRegisterForRemoteNotificationsWithDeviceToken:` method of your `AppDelegate`.

 @param application Same parameter as in the forwarded delegate method.
 @param deviceToken Same parameter as in the forwarded delegate method.
 */
+ (void) application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;

/**
 Forwards an application delegate to the SDK.

 Method to call in your `application:didFailToRegisterForRemoteNotificationsWithError:` method of your `AppDelegate`.

 Any previous device token will be forgotten.

 @param application Same parameter as in the forwarded delegate method.
 @param error Same parameter as in the forwarded delegate method.
 */
+ (void) application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;

/**
 Forwards an application delegate to the SDK.

 If your application uses backgroundModes/remote-notification, call this method in your
 `application:didReceiveLocalNotification:` method of your `AppDelegate`.
 Handles a notification and presents the associated dialog.

 @param application Same parameter as in the forwarded delegate method.
 @param notification Same parameter as in the forwarded delegate method.
 */
+ (void) application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification;

/**
 Forwards an application delegate to the SDK.

 If your application uses backgroundModes/remote-notification, call this method in your
 `application:didReceiveRemoteNotification:fetchCompletionHandler:` method.

 If you implement this application delegate function, you must call `completionHandler` at some point.
 If you do not know what to do, you're probably good with calling it right away.

 @param application Same parameter as in the forwarded delegate method.
 @param userInfo Same parameter as in the forwarded delegate method.
 @param completionHandler Same parameter as in the forwarded delegate method.
 */
+ (void) application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler;

/**
 Forwards an application delegate to the SDK.

 Method to call in your `applicationDidBecomeActive:` method of your `AppDelegate`.

 @param application Same parameter as in the forwarded delegate method.
 */
+ (void) applicationDidBecomeActive:(UIApplication *)application;

/**
 Forwards an application delegate to the SDK.

 Method to call in your `applicationDidEnterBackground:` method of your `AppDelegate`.

 @param application Same parameter as in the forwarded delegate method.
 */
+ (void) applicationDidEnterBackground:(UIApplication *)application;


///-----------------------------------------------------------
/// @name Automatic UserNotificationCenter delegate forwarding
///-----------------------------------------------------------

/**
 Setup UNUserNotificationCenterDelegate override, so that calls from the UNUserNotificationCenter are automatically transmitted to the WonderPush SDK.

 You must call this from either `application:willFinishLaunchingWithOptions:` or `application:didFinishLaunchingWithOptions:` of your AppDelegate.
 Simply call it along with `[WonderPush setupDelegateForApplication:]`.
 */
+ (void) setupDelegateForUserNotificationCenter;


///--------------------------------------------------------
/// @name Manual UserNotificationCenter delegate forwarding
///--------------------------------------------------------

/**
 You must instruct the WonderPush SDK whether you have manually forwarded the UserNotificationCenter delegate.
 The SDK would otherwise not be able to properly handle notifications in some cases.

 @param enabled Use `YES` if you have manually forwarded the UserNotificationCenter delegate methods to the WonderPush SDK.
 */
+ (void) setUserNotificationCenterDelegateInstalled:(BOOL)enabled;

/**
 Forwards a UserNotificationCenter delegate to the SDK.

 Method to call in your `userNotificationCenter:willPresentNotification:withCompletionHandler:` method of your `NotificationCenterDelegate`.

 @param center Same parameter as in the forwarded delegate method.
 @param notification Same parameter as in the forwarded delegate method.
 @param completionHandler Same parameter as in the forwarded delegate method.
 */
+ (void) userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler;

/**
 Forwards a UserNotificationCenter delegate to the SDK.

 Method to call in your `userNotificationCenter:didReceiveNotificationResponse:withCompletionHandler:` method of your `NotificationCenterDelegate`.

 @param center Same parameter as in the forwarded delegate method.
 @param response Same parameter as in the forwarded delegate method.
 @param completionHandler Same parameter as in the forwarded delegate method.
 */
+ (void) userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void(^)())completionHandler;


@end
