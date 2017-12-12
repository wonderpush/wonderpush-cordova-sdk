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

- (void)pluginInitialize {
    // Because we use `<param name="onload" value="true"/>`, this method is called inside
    // - (BOOL)application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)launchOptions

    [WonderPush setLogging:YES];

    NSString *clientId = [self.commandDelegate.settings objectForKey:[@"CLIENT_ID" lowercaseString]];
    NSString *clientSecret = [self.commandDelegate.settings objectForKey:[@"CLIENT_SECRET" lowercaseString]];
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

- (void)initialize:(CDVInvokedUrlCommand*)command {
    // No-op
    // already done in pluginInitialize for iOS
}

- (void)trackEvent:(CDVInvokedUrlCommand *)command {
    NSString *type = (NSString *)command.arguments[0];
    NSDictionary *data = nil;
    if (command.arguments.count > 1) {
        data = (NSDictionary *)command.arguments[1];
    }
    [WonderPush trackEvent:type withData:data];
}

- (void)putInstallationCustomProperties:(CDVInvokedUrlCommand *)command {
    NSDictionary *customProperties = (NSDictionary *)command.arguments[0];
    [WonderPush putInstallationCustomProperties:customProperties];
}

- (void)setNotificationEnabled:(CDVInvokedUrlCommand *)command {
    NSNumber *enabled = (NSNumber *)command.arguments[0];
    [WonderPush setNotificationEnabled:[enabled boolValue]];
}

@end
