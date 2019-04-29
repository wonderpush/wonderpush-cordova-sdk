//
//  NotificationServiceExtension.h
//  WonderPushExtension
//
//  Created by Stéphane JAIS on 26/02/2019.
//  Copyright © 2019 WonderPush. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "WPNotificationServiceExtension.h"

NS_ASSUME_NONNULL_BEGIN

@interface WPNotificationService: WPNotificationServiceExtension
@end

@interface WonderPushNotificationServiceExtension: NSObject
+ (BOOL)serviceExtension:(UNNotificationServiceExtension *)extension didReceiveNotificationRequest:(UNNotificationRequest *)request withContentHandler:(void (^)(UNNotificationContent *contentToDeliver))contentHandler;
+ (BOOL)serviceExtensionTimeWillExpire:(UNNotificationServiceExtension *)extension;
@end

NS_ASSUME_NONNULL_END
