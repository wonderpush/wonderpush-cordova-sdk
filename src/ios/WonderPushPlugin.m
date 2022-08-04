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

#import "WonderPushPlugin.h"
#import <WonderPush/WonderPush.h>
#import <CoreLocation/CoreLocation.h>

@implementation WonderPushPlugin

#pragma mark - Initialization

- (void)pluginInitialize {
    // Because we use `<param name="onload" value="true"/>`, this method is called inside
    // - (BOOL)application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)launchOptions

    [WonderPush setLogging:[@"true" isEqualToString:[self.commandDelegate.settings objectForKey:[@"WONDERPUSH_LOGGING" lowercaseString]]]];

    self.jsCallbackWaitersLock = [NSLock new];
    self.jsCallbackWaiters = [NSMutableDictionary new];

    // Stop initialization here if told to
    if ([@"false" isEqualToString:[self.commandDelegate.settings objectForKey:[@"WONDERPUSH_AUTO_INIT" lowercaseString]]]) {
        NSLog(@"[WonderPush] Initialization left to the developer as requested (AUTO_INIT=false)");
    } else {
        NSString *consentString = [self.commandDelegate.settings objectForKey:[@"WONDERPUSH_REQUIRES_USER_CONSENT" lowercaseString]];
        if (consentString) {
          [WonderPush setRequiresUserConsent:[@"true" isEqualToString:consentString]];
        }
        NSString *clientId = [self.commandDelegate.settings objectForKey:[@"WONDERPUSH_CLIENT_ID" lowercaseString]];
        NSString *clientSecret = [self.commandDelegate.settings objectForKey:[@"WONDERPUSH_CLIENT_SECRET" lowercaseString]];
        if (clientId && clientSecret) {
            [WonderPush setClientId:clientId secret:clientSecret];
        }
        [WonderPush setupDelegateForApplication:[UIApplication sharedApplication]];
        [WonderPush setupDelegateForUserNotificationCenter];
    }

    [WonderPush setIntegrator:@"wonderpush-cordova-sdk-3.1.0"];


    // Here we have no access to launchOptions from application:didFinishLaunchingWithOptions:,
    // so we must wait for the notification posted shortly after.
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(UIApplicationDidFinishLaunchingNotification:)
                                                 name:UIApplicationDidFinishLaunchingNotification
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onNotificationReceived:)
                                                 name:WP_NOTIFICATION_RECEIVED
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onNotificationOpened:)
                                                 name:WP_NOTIFICATION_OPENED
                                               object:nil];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(onRegisteredCallback:)
                                                 name:WP_NOTIFICATION_REGISTERED_CALLBACK
                                               object:nil];

}

- (void)UIApplicationDidFinishLaunchingNotification:(NSNotification *)notification {
    NSDictionary *launchOptions = [notification userInfo];
    [WonderPush application:[UIApplication sharedApplication] didFinishLaunchingWithOptions:launchOptions];
}

- (void)onNotificationReceived:(NSNotification *)notification {
    NSDictionary *pushNotification = notification.userInfo;
    NSDictionary *wpData = pushNotification[@"_wp"];
    if (![wpData isKindOfClass:[NSDictionary class]]) wpData = @{};
    NSString *pushNotificationType = wpData[@"type"];
    if (![pushNotificationType isKindOfClass:[NSString class]]) pushNotificationType = @"simple";
    if ([pushNotificationType isEqualToString:@"data"]) {
        // Send the notificationOpen event for data notifications just like it does on Android
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{
                                                                                                              @"type": @"notificationOpen",
                                                                                                              @"notification": pushNotification,
                                                                                                              @"notificationType": pushNotificationType,
                                                                                                              }];
        [result setKeepCallbackAsBool:YES];
        [self.commandDelegate sendPluginResult:result callbackId:self.jsEventForwarder.callbackId];
    }
}

- (void)onNotificationOpened:(NSNotification *)notification {
    NSDictionary *pushNotification = notification.userInfo;
    NSDictionary *wpData = pushNotification[@"_wp"];
    if (![wpData isKindOfClass:[NSDictionary class]]) wpData = @{};
    NSString *pushNotificationType = wpData[@"type"];
    if (![pushNotificationType isKindOfClass:[NSString class]]) pushNotificationType = @"simple";
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{
                                                                                                          @"type": @"notificationOpen",
                                                                                                          @"notification": pushNotification,
                                                                                                          @"notificationType": pushNotificationType,
                                                                                                          }];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:self.jsEventForwarder.callbackId];
}

- (void)onRegisteredCallback:(NSNotification *)notification {
    NSString *method = notification.userInfo[WP_REGISTERED_CALLBACK_METHOD_KEY];
    NSString *arg = notification.userInfo[WP_REGISTERED_CALLBACK_PARAMETER_KEY];
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{
                                                                                                          @"type": @"registeredCallback",
                                                                                                          @"method": method,
                                                                                                          @"arg": arg,
                                                                                                          }];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:self.jsEventForwarder.callbackId];
}

- (void)__setEventForwarder:(CDVInvokedUrlCommand *)command {
    self.jsEventForwarder = command;
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)initialize:(CDVInvokedUrlCommand *)command {
    NSString *clientId = (NSString *)command.arguments[0];
    NSString *clientSecret = (NSString *)command.arguments[1];

    [WonderPush setClientId:clientId secret:clientSecret];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)setUserId:(CDVInvokedUrlCommand *)command {
    NSString *userId = (NSString *)command.arguments[0];
    if ((id)userId == [NSNull null]) userId = nil;

    [WonderPush setUserId:userId];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)setLogging:(CDVInvokedUrlCommand *)command {
    NSNumber *enabled = (NSNumber *)command.arguments[0];

    [WonderPush setLogging:[enabled boolValue]];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

#pragma mark - Delegate

- (void) wonderPushWillOpenURL:( NSURL * )url withCompletionHandler:(void (^)(NSURL *url))completionHandler {
    __block bool cbCalled = false;
    void (^cb)(id value) = ^(id value) {
        if (cbCalled) {
            return;
        } else {
            cbCalled = YES;
        }
        if ([value isKindOfClass:[NSString class]]) {
            completionHandler([NSURL URLWithString:(NSString *)value]);
        } else {
            completionHandler(nil);
        }
    };

    // Call to the JavaScript application code
    NSString *callbackId = [self createJsCallbackWaiter:cb];
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{
                                                                                                          @"method": @"wonderPushWillOpenURL",
                                                                                                          @"__callbackId": callbackId,
                                                                                                          @"url": url.absoluteString,
                                                                                                          }];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:self.jsDelegateCommand.callbackId];

    // Ensure we don't wait too long and proceed anyway
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        if (!cbCalled) {
            NSLog(@"[WonderPush] Delegate did not call urlForDeepLink's callback fast enough. Continuing normal processing.");
            cb([url absoluteString]);
        }
    });
}


- (NSString *)createJsCallbackWaiter:(void (^)(id value))cb {
    [self.jsCallbackWaitersLock lock];
    NSString *callbackId = [[NSUUID UUID] UUIDString];
    self.jsCallbackWaiters[callbackId] = cb;
    [self.jsCallbackWaitersLock unlock];
    return callbackId;
}

- (void)jsCalledBack:(NSString *)callbackId value:(id)value {
    [self.jsCallbackWaitersLock lock];
    void (^cb)(id value) = self.jsCallbackWaiters[callbackId];
    self.jsCallbackWaiters[callbackId] = nil;
    [self.jsCallbackWaitersLock unlock];
    cb(value);
}

- (void)__callback:(CDVInvokedUrlCommand *)command {
    NSString *callbackId = (NSString *)command.arguments[0];
    id value = command.arguments[1];
    [self jsCalledBack:callbackId value:value];
}

- (void)setDelegate:(CDVInvokedUrlCommand *)command {
    NSNumber *enabled = (NSNumber *)command.arguments[0];
    self.jsDelegateCommand = command;
    [WonderPush setDelegate:([enabled boolValue] ? self : nil)];
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    [result setKeepCallbackAsBool:YES];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

#pragma mark - Core information

- (void)getUserId:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush userId];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void)getInstallationId:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush installationId];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void)getDeviceId:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush deviceId];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void)getPushToken:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush pushToken];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void)getAccessToken:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush accessToken];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

#pragma mark - Installation data and events

- (void)trackEvent:(CDVInvokedUrlCommand *)command {
    NSString *type = (NSString *)command.arguments[0];
    NSDictionary *data = nil;
    if (command.arguments.count > 1) {
        data = (NSDictionary *)command.arguments[1];
    }
    [WonderPush trackEvent:type attributes:data];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)addTag:(CDVInvokedUrlCommand *)command {
    id arg = command.arguments[0];
    if ([arg isKindOfClass:[NSArray class]]) {
        [WonderPush addTags:(NSArray *)arg];
    } else if ([arg isKindOfClass:[NSString class]]) {
        [WonderPush addTag:(NSString *)arg];
    }

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)removeTag:(CDVInvokedUrlCommand *)command {
    id arg = command.arguments[0];
    if ([arg isKindOfClass:[NSArray class]]) {
        [WonderPush removeTags:(NSArray *)arg];
    } else if ([arg isKindOfClass:[NSString class]]) {
        [WonderPush removeTag:(NSString *)arg];
    }

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)removeAllTags:(CDVInvokedUrlCommand *)command {
    [WonderPush removeAllTags];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)getTags:(CDVInvokedUrlCommand *)command {
    NSOrderedSet<NSString *> *rtn = [WonderPush getTags];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:[rtn array]] callbackId:command.callbackId];
}

- (void)hasTag:(CDVInvokedUrlCommand *)command {
    NSString *tag = (NSString *)command.arguments[0];
    BOOL rtn = [WonderPush hasTag:tag];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:rtn] callbackId:command.callbackId];
}

- (void)setProperty:(CDVInvokedUrlCommand *)command {
    NSString *field = (NSString *)command.arguments[0];
    id value = command.arguments[1];
    [WonderPush setProperty:field value:value];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)unsetProperty:(CDVInvokedUrlCommand *)command {
    NSString *field = (NSString *)command.arguments[0];
    [WonderPush unsetProperty:field];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)addProperty:(CDVInvokedUrlCommand *)command {
    NSString *field = (NSString *)command.arguments[0];
    id value = command.arguments[1];
    [WonderPush addProperty:field value:value];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)removeProperty:(CDVInvokedUrlCommand *)command {
    NSString *field = (NSString *)command.arguments[0];
    id value = command.arguments[1];
    [WonderPush removeProperty:field value:value];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)getPropertyValue:(CDVInvokedUrlCommand *)command {
    NSString *field = (NSString *)command.arguments[0];
    id rtn = [WonderPush getPropertyValue:field];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:@{@"__wrapped":rtn}] callbackId:command.callbackId];
}

- (void)getPropertyValues:(CDVInvokedUrlCommand *)command {
    NSString *field = (NSString *)command.arguments[0];
    id rtn = [WonderPush getPropertyValues:field];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsMultipart:@[rtn]] callbackId:command.callbackId];
}

- (void)getProperties:(CDVInvokedUrlCommand *)command {
    NSDictionary *rtn = [WonderPush getProperties];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:rtn] callbackId:command.callbackId];
}

- (void)putProperties:(CDVInvokedUrlCommand *)command {
    NSDictionary *properties = (NSDictionary *)command.arguments[0];
    [WonderPush putProperties:properties];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)getInstallationCustomProperties:(CDVInvokedUrlCommand *)command {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    NSDictionary *rtn = [WonderPush getInstallationCustomProperties];
#pragma clang diagnostic pop

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:rtn] callbackId:command.callbackId];
}

- (void)putInstallationCustomProperties:(CDVInvokedUrlCommand *)command {
    NSDictionary *customProperties = (NSDictionary *)command.arguments[0];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [WonderPush putInstallationCustomProperties:customProperties];
#pragma clang diagnostic pop

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

#pragma mark - Push notification handling

- (void)subscribeToNotifications:(CDVInvokedUrlCommand *)command {
    [WonderPush subscribeToNotifications];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)isSubscribedToNotifications:(CDVInvokedUrlCommand *)command {
    BOOL rtn = [WonderPush isSubscribedToNotifications];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:rtn] callbackId:command.callbackId];
}

- (void)unsubscribeFromNotifications:(CDVInvokedUrlCommand *)command {
    [WonderPush unsubscribeFromNotifications];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)getNotificationEnabled:(CDVInvokedUrlCommand *)command {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    BOOL rtn = [WonderPush getNotificationEnabled];
#pragma clang diagnostic pop

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:rtn] callbackId:command.callbackId];
}

- (void)setNotificationEnabled:(CDVInvokedUrlCommand *)command {
    NSNumber *enabled = (NSNumber *)command.arguments[0];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    [WonderPush setNotificationEnabled:[enabled boolValue]];
#pragma clang diagnostic pop

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)getUserConsent:(CDVInvokedUrlCommand *)command {
    BOOL rtn = [WonderPush getUserConsent];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:rtn] callbackId:command.callbackId];
}

- (void)setUserConsent:(CDVInvokedUrlCommand *)command {
    NSNumber *enabled = (NSNumber *)command.arguments[0];

    [WonderPush setUserConsent:[enabled boolValue]];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)clearAllData:(CDVInvokedUrlCommand *)command {
    [WonderPush clearAllData];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)clearEventsHistory:(CDVInvokedUrlCommand *)command {
    [WonderPush clearEventsHistory];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)clearPreferences:(CDVInvokedUrlCommand *)command {
    [WonderPush clearPreferences];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)downloadAllData:(CDVInvokedUrlCommand *)command {
    [WonderPush downloadAllData:^(NSData *data, NSError *error) {
        if (error) {
            [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[error localizedDescription]] callbackId:command.callbackId];
        }
        if (data == nil) {
            [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"got no data"] callbackId:command.callbackId];
        }
        NSString *text = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        UIActivityViewController *sharing = [[UIActivityViewController alloc] initWithActivityItems:@[text] applicationActivities:nil];
        [[[[UIApplication sharedApplication] keyWindow] rootViewController] presentViewController:sharing animated:YES completion:^{
            [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
        }];
    }];
}

#pragma mark - Geolocation
- (void) enableGeolocation:(CDVInvokedUrlCommand *)command {
    [WonderPush enableGeolocation];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void) disableGeolocation:(CDVInvokedUrlCommand *)command {
    [WonderPush disableGeolocation];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void) setGeolocation:(CDVInvokedUrlCommand *)command {
    double latitude, longitude;
    if (command.arguments.count > 0 && [command.arguments[0] isKindOfClass:NSDictionary.class]) {
        NSDictionary *dict = command.arguments[0];
        NSNumber *latitudeNumber = [dict objectForKey:@"latitude"];
        NSNumber *longitudeNumber = [dict objectForKey:@"longitude"];
        latitude = latitudeNumber ? latitudeNumber.doubleValue : 0;
        longitude = longitudeNumber ? longitudeNumber.doubleValue : 0;
     } else if (command.arguments.count > 1
        && [command.arguments[0] isKindOfClass:NSNumber.class]
        && [command.arguments[1] isKindOfClass:NSNumber.class]) {
        latitude = [command.arguments[0] doubleValue];
        longitude = [command.arguments[1] doubleValue];
    } else if (command.arguments.count > 1
        && [command.arguments[0] isKindOfClass:NSString.class]
        && [command.arguments[1] isKindOfClass:NSString.class]) {
        latitude = [command.arguments[0] doubleValue];
        longitude = [command.arguments[1] doubleValue];
    }

    CLLocation *location = [[CLLocation alloc] initWithLatitude:latitude longitude:longitude];
    [WonderPush setGeolocation:location];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

#pragma mark - Country, currency, locale, timeZone
- (void) getCountry:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush country];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void) setCountry:(CDVInvokedUrlCommand *)command {
    NSString *val = (NSString *)command.arguments[0];
    if ((id)val == [NSNull null]) val = nil;
    [WonderPush setCountry:val];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void) getCurrency:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush currency];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void) setCurrency:(CDVInvokedUrlCommand *)command {
    NSString *val = (NSString *)command.arguments[0];
    if ((id)val == [NSNull null]) val = nil;
    [WonderPush setCurrency:val];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void) getLocale:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush locale];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void) setLocale:(CDVInvokedUrlCommand *)command {
    NSString *val = (NSString *)command.arguments[0];
    if ((id)val == [NSNull null]) val = nil;
    [WonderPush setLocale:val];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void) getTimeZone:(CDVInvokedUrlCommand *)command {
    NSString *rtn = [WonderPush timeZone];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:rtn] callbackId:command.callbackId];
}

- (void) setTimeZone:(CDVInvokedUrlCommand *)command {
    NSString *val = (NSString *)command.arguments[0];
    if ((id)val == [NSNull null]) val = nil;
    [WonderPush setTimeZone:val];
    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

@end
