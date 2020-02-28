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

#import <Foundation/Foundation.h>
#import <Cordova/CDV.h>
#import <Cordova/CDVPlugin.h>

#import <WonderPush/WonderPush.h>

@interface WonderPushPlugin : CDVPlugin <WonderPushDelegate>

@property (strong, nonatomic) CDVInvokedUrlCommand *jsEventForwarder;

@property (strong, nonatomic) CDVInvokedUrlCommand *jsDelegateCommand;
@property (strong, nonatomic) NSLock *jsCallbackWaitersLock;
@property (strong, nonatomic) NSMutableDictionary<NSString *, void(^)(id value)> *jsCallbackWaiters;

// Initialization
- (void)pluginInitialize;
- (void)UIApplicationDidFinishLaunchingNotification:(NSNotification *)notification;
- (void)onNotificationReceived:(NSNotification *)notification;
- (void)onNotificationOpened:(NSNotification *)notification;
- (void)__setEventForwarder:(CDVInvokedUrlCommand *)command;

- (void)initialize:(CDVInvokedUrlCommand *)command;
- (void)setUserId:(CDVInvokedUrlCommand *)command;
- (void)isReady:(CDVInvokedUrlCommand *)command;
- (void)setLogging:(CDVInvokedUrlCommand *)command;

// Delegate
- (void)__callback:(CDVInvokedUrlCommand *)command;
- (NSString *)createJsCallbackWaiter:(void (^)(id value))cb;
- (void)jsCalledBack:(NSString *)callbackId value:(id)value;
- (void)setDelegate:(CDVInvokedUrlCommand *)command;

// Core information
- (void)getUserId:(CDVInvokedUrlCommand *)command;
- (void)getInstallationId:(CDVInvokedUrlCommand *)command;
- (void)getDeviceId:(CDVInvokedUrlCommand *)command;
- (void)getPushToken:(CDVInvokedUrlCommand *)command;
- (void)getAccessToken:(CDVInvokedUrlCommand *)command;

- (void)trackEvent:(CDVInvokedUrlCommand*)command;
- (void)addTag:(CDVInvokedUrlCommand*)command;
- (void)removeTag:(CDVInvokedUrlCommand*)command;
- (void)removeAllTags:(CDVInvokedUrlCommand*)command;
- (void)getTags:(CDVInvokedUrlCommand*)command;
- (void)hasTag:(CDVInvokedUrlCommand*)command;
- (void)setProperty:(CDVInvokedUrlCommand *)command;
- (void)unsetProperty:(CDVInvokedUrlCommand *)command;
- (void)addProperty:(CDVInvokedUrlCommand *)command;
- (void)removeProperty:(CDVInvokedUrlCommand *)command;
- (void)getPropertyValue:(CDVInvokedUrlCommand *)command;
- (void)getPropertyValues:(CDVInvokedUrlCommand *)command;
- (void)getProperties:(CDVInvokedUrlCommand *)command;
- (void)putProperties:(CDVInvokedUrlCommand *)command;
- (void)getInstallationCustomProperties:(CDVInvokedUrlCommand *)command;
- (void)putInstallationCustomProperties:(CDVInvokedUrlCommand *)command;

// Push notification handling
- (void)subscribeToNotifications:(CDVInvokedUrlCommand *)command;
- (void)isSubscribedToNotifications:(CDVInvokedUrlCommand *)command;
- (void)unsubscribeFromNotifications:(CDVInvokedUrlCommand *)command;
- (void)getNotificationEnabled:(CDVInvokedUrlCommand *)command;
- (void)setNotificationEnabled:(CDVInvokedUrlCommand *)command;

// Privacy
- (void)getUserConsent:(CDVInvokedUrlCommand *)command;
- (void)setUserConsent:(CDVInvokedUrlCommand *)command;
- (void)clearAllData:(CDVInvokedUrlCommand *)command;
- (void)clearEventsHistory:(CDVInvokedUrlCommand *)command;
- (void)clearPreferences:(CDVInvokedUrlCommand *)command;
- (void)downloadAllData:(CDVInvokedUrlCommand *)command;

// Geolocation
- (void) enableGeolocation:(CDVInvokedUrlCommand *)command;
- (void) disableGeolocation:(CDVInvokedUrlCommand *)command;
- (void) setGeolocation:(CDVInvokedUrlCommand *)command;

// Country, currency, locale, timeZone
- (void) getCountry:(CDVInvokedUrlCommand *)command;
- (void) setCountry:(CDVInvokedUrlCommand *)command;
- (void) getCurrency:(CDVInvokedUrlCommand *)command;
- (void) setCurrency:(CDVInvokedUrlCommand *)command;
- (void) getLocale:(CDVInvokedUrlCommand *)command;
- (void) setLocale:(CDVInvokedUrlCommand *)command;
- (void) getTimeZone:(CDVInvokedUrlCommand *)command;
- (void) setTimeZone:(CDVInvokedUrlCommand *)command;

@end
