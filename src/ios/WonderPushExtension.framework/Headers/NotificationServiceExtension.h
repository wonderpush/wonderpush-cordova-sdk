/*
 Copyright 2017 WonderPush

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

#ifndef WonderPush_NotificationServiceExtension_h
#define WonderPush_NotificationServiceExtension_h

#include <Foundation/Foundation.h>
#include <UserNotifications/UserNotifications.h>


/**
 Make your `NotificationService` class extend this class to delegate entirely all processing
 to the WonderPush NotificaitonServiceExtension SDK, without writing code.

 Look at [the guide](https://www.wonderpush.com/docs/ios/getting-started#ios-getting-started-rich-notifications) for more information.
 */
@interface WPNotificationService : UNNotificationServiceExtension

@end


/**
 `WonderPushNotificationServiceExtension` is your main interface to the WonderPush NotificationServiceExtension SDK.

 Make sure you properly installed the WonderPush NotificationServiceExtension SDK, as described in [the guide](https://www.wonderpush.com/docs/ios/getting-started#ios-getting-started-rich-notifications).

 The easiest way to integrate is to make your `NotificationService` extend `WPNotificationService` and remove all code inside it.
 */
@interface WonderPushNotificationServiceExtension : NSObject

/**
 Forwards a NotificationServiceExtension call to the SDK.

 Method to call in your `didReceiveNotificationRequest:withContentHandler:` method of your `NotificationService` extension.
 Pass `self` in the first argument.

 @param extension Simply pass `self` from your `NotificationService` class.
 @param request Same parameter as in the forwarded protocol method.
 @param contentHandler Same parameter as in the forwarded protocol method.

 @return `YES` if the call was handled by WonderPush, `NO` otherwise.
 */
+ (BOOL)serviceExtension:(UNNotificationServiceExtension *)extension didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent *contentToDeliver))contentHandler;

/**
 Forwards a NotificationServiceExtension call to the SDK.

 Method to call in your `serviceExtensionTimeWillExpire` method of your `NotificationService` extension.
 Pass `self` in the first argument.

 @param extension Simply pass `self` from your `NotificationService` class.

 @return `YES` if the call was handled by WonderPush, `NO` otherwise.
 */
+ (BOOL)serviceExtensionTimeWillExpire:(UNNotificationServiceExtension *)extension;

@end


#endif /* WonderPush_NotificationServiceExtension_h */
