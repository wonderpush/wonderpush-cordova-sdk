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

@implementation WonderPushPlugin

#pragma mark - Initialization

- (void)pluginInitialize {
    // Because we use `<param name="onload" value="true"/>`, this method is called inside
    // - (BOOL)application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)launchOptions

    [WonderPush setLogging:YES];

    NSString *clientId = [self.commandDelegate.settings objectForKey:[@"WONDERPUSH_CLIENT_ID" lowercaseString]];
    NSString *clientSecret = [self.commandDelegate.settings objectForKey:[@"WONDERPUSH_CLIENT_SECRET" lowercaseString]];
    [WonderPush setClientId:clientId secret:clientSecret];
    [WonderPush setupDelegateForApplication:[UIApplication sharedApplication]];
    [WonderPush setupDelegateForUserNotificationCenter];

    // Here we have no access to launchOptions from application:didFinishLaunchingWithOptions:,
    // so we must wait for the notification posted shortly after.
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(UIApplicationDidFinishLaunchingNotification:)
                                                 name:UIApplicationDidFinishLaunchingNotification
                                               object:nil];
}

- (void)UIApplicationDidFinishLaunchingNotification:(NSNotification *)notification {
    NSDictionary *launchOptions = [notification userInfo];
    [WonderPush application:[UIApplication sharedApplication] didFinishLaunchingWithOptions:launchOptions];
}

- (void)setUserId:(CDVInvokedUrlCommand *)command {
    NSString *userId = (NSString *)command.arguments[0];
    if (userId == [NSNull null]) userId = nil;

    [WonderPush setUserId:userId];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

- (void)isReady:(CDVInvokedUrlCommand *)command {
    BOOL rtn = [WonderPush isReady];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:rtn] callbackId:command.callbackId];
}

- (void)setLogging:(CDVInvokedUrlCommand *)command {
    NSNumber *enabled = (NSNumber *)command.arguments[0];

    [WonderPush setLogging:[enabled boolValue]];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
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
    [WonderPush trackEvent:type withData:data];

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
    NSDictionary *rtn = [WonderPush getInstallationCustomProperties];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:rtn] callbackId:command.callbackId];
}

- (void)putInstallationCustomProperties:(CDVInvokedUrlCommand *)command {
    NSDictionary *customProperties = (NSDictionary *)command.arguments[0];
    [WonderPush putInstallationCustomProperties:customProperties];

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
    BOOL rtn = [WonderPush getNotificationEnabled];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:rtn] callbackId:command.callbackId];
}

- (void)setNotificationEnabled:(CDVInvokedUrlCommand *)command {
    NSNumber *enabled = (NSNumber *)command.arguments[0];

    [WonderPush setNotificationEnabled:[enabled boolValue]];

    [self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK] callbackId:command.callbackId];
}

@end
