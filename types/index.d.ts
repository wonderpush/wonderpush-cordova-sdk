export interface WonderPushDelegate {
  urlForDeepLink?: (url: string, callback: (url?: string) => void) => void;
  onNotificationOpened?: (notification: object, buttonIndex: number) => void;
  onNotificationReceived?: (notification: object) => void;
}

export interface WonderPushChannel {
  id: string;
  groupId?: string;
  name?: string;
  description?: string;
  bypassDnd?: boolean;
  showBadge?: boolean;
  importance?: number;
  lights?: boolean;
  lightColor?: number;
  vibrate?: boolean;
  sound?: boolean;
  soundUri?: string;
  lockscreenVisibility?: number;
  vibrateInSilentMode?: boolean;
  color?: number;
  localOnly?: boolean;
}

export interface WonderPushChannelGroup {
  id: string;
  name?: string;
}

export interface UserPreferences  {
  /**
   * Get the default channel id
   * @returns {Promise<string>}
   */
  getDefaultChannelId(): Promise<string>;

  /**
   * Set the default channel id
   * @param {string} id
   * @returns {Promise<void>}
   */
  setDefaultChannelId(id: string): Promise<void>;

  /**
   * Get a channel group
   * @param {string} groupId
   * @returns {Promise<WonderPushChannelGroup | null>}
   */
  getChannelGroup(groupId: string): Promise<WonderPushChannelGroup | null>;

  /**
   * Get a channel
   * @param {string} channelId
   * @returns {Promise<WonderPushChannel | null>}
   */
  getChannel(channelId: string): Promise<WonderPushChannel | null>;

  /**
   * Create, update and remove channel existing groups to match the given channel groups
   * @param {WonderPushChannelGroup[]} channelGroups
   * @returns {Promise<void>}
   */
  setChannelGroups(channelGroups: WonderPushChannelGroup[]): Promise<void>;

  /**
   * Create, update and remove channels to match the given channels
   * @param {WonderPushChannel[]} channels
   * @returns {Promise<void>}
   */
  setChannels(channels: WonderPushChannel[]): Promise<void>;

  /**
   * Create or update a channel group
   * @param {WonderPushChannelGroup} channelGroup
   * @returns {Promise<void>}
   */
  putChannelGroup(channelGroup: WonderPushChannelGroup): Promise<void>;

  /**
   * Create or update a channel
   * @param {WonderPushChannel} channel
   * @returns {Promise<void>}
   */
  putChannel(channel: WonderPushChannel): Promise<void>;

  /**
   * Remove a channel group
   * @param {string} groupId
   * @returns {Promise<void>}
   */
  removeChannelGroup(groupId: string): Promise<void>;

  /**
   * Remove a channel
   * @param {string} channelId
   * @returns {Promise<void>}
   */
  removeChannel(channelId: string): Promise<void>;
}

/**
 * @name Push Notifications - WonderPush
 * @description
 *
 * Send unlimited push notifications to iOS and Android devices.
 *
 * Get started in minutes: [Ionic Quickstart Guide](https://docs.wonderpush.com/docs/ionic-quickstart).
 *
 * Advanced segmentation, automation and personalization of push messages for €1 per 1000 subscribers.
 *
 * Requires the Cordova plugin `wonderpush-cordova-sdk`.
 *
 * [WonderPush push notifications](https://www.wonderpush.com) are the most effective way
 * to retain your users and grow your audience while remaining fully GDPR compliant.
 *
 * @usage
 * ```typescript
 * import { WonderPush } from 'wonderpush-cordova-sdk';
 *
 * // Subscribe user
 * WonderPush.subscribeToNotifications()
 *   .then(() => console.log("User subscribed to notifications"))
 *   .catch((error: any) => console.error(error));
 *
 *
 * // Send an event (a purchase in this example)
 * WonderPush.sendEvent('purchase', {
 *   float_price: 12.99,
 *   string_sku: "X123456"
 * });
 *
 * // Tag users (as customers)
 * WonderPush.addTag('customer');
 *
 * // Personalize
 * // 1. Store user details.
 * // 2. Use those details to create segments.
 * // 3. Include those details in your notifications.
 * WonderPush.putProperties({
 *   string_name: 'John D.',
 *   int_age: 24
 * });
 *
 * // GDPR
 * // 1. set REQUIRES_USER_CONSENT=true to enable GDPR compliance.
 * // 2. WonderPush doesn't start until setUserConsent(true) is called.
 * const onClick = (userConsent: boolean) => WonderPush.setUserConsent(userConsent);
 *
 * // Listen to notification clicks
 * document.addEventListener('wonderpush.notificationOpen', function(event) {
 *   console.log('Notification opened', event.notification);
 *   if (event.notificationType === 'data') {
 *     console.log('Silent notification', event.notification);
 *   }
 * });
 * ```
 *
 * @interfaces
 * WonderPushChannel
 * WonderPushChannelGroup
 */

type SuccessCallback = () => void;
type FailureCallback = (e: Error) => void;
export interface WonderPushPlugin {

  /**
   * Initializes the WonderPush SDK
   * @param clientId
   * @param clientSecret
   */
  initialize(clientId: string, clientSecret: string): Promise<void>;

  /**
   * Initializes the SDK and remembers credentials for subsequent auto-initialization.
   * You can disable AUTO_INIT or instead use `"USE_REMEMBERED"` as a value for the Client ID and Client Secret.
   * This is aimed at enabling complex integration scenarios where the Client ID and Client Secret are resolved dynamically and reused ever after.
   * If you provide a null value, the credential will be forgotten and the SDK won't be initialized.
   * @param clientId
   * @param clientSecret
   */
  initializeAndRememberCredentials(clientId: string|null, clientSecret: string|null): Promise<void>;

  /**
   * Returns the remembered Client ID given to `initializeAndRememberCredentials()`.
   * There is no similar getter for the Client Secret.
   * @returns The remembered Client ID if both a non-empty Client ID and Client Secret were last remembered, `null` otherwise.
   */
  getRememberedClientId(): Promise<string|null>;

  /**
   * Whether the SDK has been initialized.
   *
   * The SDK is ready when it is initialized with its Client ID and Client Secret.
   * @returns {Promise<boolean>}
   */
  isInitialized(): Promise<boolean>;

  /**
   * Sets the user id, used to identify a single identity across multiple devices,
   * and to correctly identify multiple users on a single device.
   *
   * If not called, the last used user id it assumed. Defaulting to `null` if none is known.
   *
   * Upon changing userId, the access token is wiped, so avoid unnecessary calls, like calling with `null`
   * just before calling with a user id.
   *
   * @param {?string} userId - The user id, unique to your application.
   *   Use `null` for anonymous users.
   *
   *   You are strongly encouraged to use your own unique internal identifier.
   * @returns {Promise<void>}
   */

  setUserId(userId: string | null): Promise<void>;

  /**
   * Controls native SDK logging.
   * @param {boolean} enabled - Whether to enable logs.
   * @returns {Promise<void>}
   */
  setLogging(enabled: boolean): Promise<void>;

  /**
   * Sets up a delegate for tighter integration, or removes it.
   * @param {?WonderPushDelegate} delegate - The delegate to set, or `null` to remove it.
   * @returns {Promise<void>}
   */
  setDelegate(delegate: WonderPushDelegate | null): Promise<void>;

  /**
   * Gets the current delegate.
   * @returns {Promise<WonderPushDelegate | null>} A promise with the delegate of null
   */
  getDelegate(): Promise<WonderPushDelegate | null>;

  /**
   * Returns the userId currently in use, `null` by default.
   * @returns {Promise<string | null>} A promise with the user ID or null
   */
  getUserId(): Promise<string | null>;

  /**
   * Returns the installationId identifying your application on a device, bond to a specific userId.
   * If you want to store this information on your servers, keep the corresponding userId with it.
   * Will return `null` until the SDK is properly initialized.
   * @returns {Promise<string | null>} A promise with the installation ID or null
   */
  getInstallationId(): Promise<string | null>;

  /**
   * Returns the unique device identifier
   * @returns {Promise<string | null>} A promise with the device ID or null
   */
  getDeviceId(): Promise<string | null>;

  /**
   * Returns the push token.
   * @returns {Promise<string | null>} A promise with the push token or `null`
   */
  getPushToken(): Promise<string | null>;

  /**
   * Returns the currently used access token.
   * Returns `null` until the SDK is properly initialized.
   * This together with your client secret gives entire control to the current installation and associated user, you should not disclose it unnecessarily.
   * @returns {Promise<string | null>}
   */
  getAccessToken(): Promise<string | null>;

  /**
   * Send an event to be tracked to WonderPush.
   *
   * @param {string} type - The event type, or name. Event types starting with an `@` character are reserved.
   * @param {?object} [attributes] - An object containing custom properties to be attached to the event.
   *   The keys should be prefixed according to the type of their values.
   *   You can find the details in the [Concepts > Custom fields](https://www.wonderpush.com/docs/guide/custom-fields) section of the documentation.
   * @returns {Promise<void>}
   */
  trackEvent(type: string, attributes: { [key: string]: any }): Promise<void>;

  /**
   * Adds one or more tags to the installation.
   * @param {string|string[]} tag - The tags to add to the installation. You can use either a single string argument or an array of strings.
   * @returns {Promise<void>}
   */
  addTag(tag: string | string[]): Promise<void>;

  /**
   * Removes one or more tags from the installation.
   * @param {string|string[]} tag - The tags to remove from the installation. You can use either a single string argument or an array of strings.
   * @returns {Promise<void>}
   */
  removeTag(tag: string | string[]): Promise<void>;

  /**
   * Removes all tags from the installation.
   * @returns {Promise<void>}
   */
  removeAllTags(): Promise<void>;

  /**
   * Returns all the tags of the installation.
   * @returns {Promise<string[]>}
   */
  getTags(): Promise<string[]>;

  /**
   * Tests whether the installation has the given tag attached to it.
   * @param {string} tag - The tag to test.
   * @returns {Promise<boolean>}
   */
  hasTag(tag: string): Promise<boolean>;

  /**
   * Sets the value to a given installation property.
   *
   * The previous value is replaced entirely.
   * Setting `undefined` or `null` has the same effect as {@link cordova.plugins.WonderPush#unsetProperty}.
   *
   * @param {string} field - The name of the property to set
   * @param value
   * @returns {Promise<void>}
   */
  setProperty(field: string, value: any): Promise<void>;

  /**
   * Removes the value of a given installation property.
   *
   * The previous value is replaced with `null`.
   *
   * @param {string} field - The name of the property
   * @returns {Promise<void>}
   */
  unsetProperty(field: string): Promise<void>;

  /**
   * Adds the value to a given installation property.
   *
   * The stored value is made an array if not already one.
   * If the given value is an array, all its values are added.
   * If a value is already present in the stored value, it won't be added.
   *
   * @param {string} field - The name of the property
   * @param value
   * @returns {Promise<void>}
   */
  addProperty(field: string, value: any): Promise<void>;

  /**
   * Removes the value from a given installation property.
   *
   * The stored value is made an array if not already one.
   * If the given value is an array, all its values are removed.
   * If a value is present multiple times in the stored value, they will all be removed.
   *
   * @param {string} field - The name of the property
   * @param value
   * @returns {Promise<void>}
   */
  removeProperty(field: string, value: any): Promise<void>;

  /**
   * Returns the value of a given installation property.
   *
   * If the property stores an array, only the first value is returned.
   * This way you don't have to deal with potential arrays if that property is not supposed to hold one.
   * Returns `null` if the property is absent or has an empty array value.
   *
   * @param {string} field - The name of the property to read values from
   * @returns {Promise<any>}
   */
  getPropertyValue(field: string): Promise<any>;

  /**
   * Returns an array of the values of a given installation property.
   *
   * If the property does not store an array, an array is returned nevertheless.
   * This way you don't have to deal with potential scalar values if that property is supposed to hold an array.
   * Returns an empty array instead of `null` if the property is absent.
   * Returns an array wrapping any scalar value held by the property.
   *
   * @param {string} field - The name of the property to read values from
   * @returns {Promise<any[]>}
   */
  getPropertyValues(field: string): Promise<any[]>;

  /**
   * Returns the latest known custom properties attached to the current installation object stored by WonderPush.
   * @returns {Promise<{[p: string]: any}>}
   */
  getProperties(): Promise<{ [key: string]: any }>;

  /**
   * Updates the properties attached to the current installation object stored by WonderPush.
   *
   * In order to remove a value, use `null`.
   *
   * @param {{[p: string]: any}} properties. The keys should be prefixed according to the type of their values. You can find the details in the [Segmentation > Properties](https://docs.wonderpush.com/docs/properties#section-custom-properties) section of the documentation.
   * @returns {Promise<void>}
   */
  putProperties(properties: { [key: string]: any }): Promise<void>;

  /**
   * Subscribes to push notification and registers the device token with WondePush.
   *
   * On iOS, you **must** call the following method at least once to make the notification visible to the user.
   *
   * - You can call this method multiple times. The user is only prompted for permission by iOS once.
   * - There is no need to call this method if the permission has already been granted, but it does not harm either.
   * - If the permission has been denied in the OS, the user will stay soft opt-out.
   *
   * Because in iOS you only have *one* chance for prompting the user, you should find a good timing for that.
   * For a start, you can systematically call it when the application starts, so that the user will be prompted directly at the first launch.
   *
   * @param {boolean|undefined} fallbackToSettings - When true, WonderPush will show a dialog prompting the user to go to settings and activate push notifications
   * @return {Promise<void>} Returns a promise that resolves upon successful subscription
   */
  subscribeToNotifications(fallbackToSettings?:boolean): Promise<void>;

  /**
   * Returns whether the notifications are enabled.
   * @returns {Promise<boolean>}
   */
  isSubscribedToNotifications(): Promise<boolean>;

  /**
   * Unsubscribes from push notification.
   * This method marks the user as soft opt-out.
   *
   * @returns {Promise<void>}
   */
  unsubscribeFromNotifications(): Promise<void>;

  /**
   * Reads user consent state.
   * Returns undefined if no explicit consent was set.
   * @returns {Promise<boolean>}
   */
  getUserConsent(): Promise<boolean>;

  /**
   * Provides or withdraws user consent.
   * If the `requiresUserConsent` initialization option is true,
   * the whole SDK is paused and no data is sent to WonderPush, until consent is provided.
   * @param {boolean} consent -
   * @returns {Promise<void>}
   */
  setUserConsent(consent: boolean): Promise<void>;

  /**
   * Remove any local storage and ask the WonderPush servers to delete any data associated with the all local installations and related users.
   * @returns {Promise<void>}
   */
  clearAllData(): Promise<void>;

  /**
   * Ask the WonderPush servers to delete any event associated with the all local installations.
   * @returns {Promise<void>}
   */
  clearEventsHistory(): Promise<void>;

  /**
   * Ask the WonderPush servers to delete any custom data associated with the all local installations and related users.
   *
   * @returns {Promise<void>}
   */
  clearPreferences(): Promise<void>;

  /**
   * Initiates the download of all user remote and local data.
   *
   * @returns {Promise<void>}
   */
  downloadAllData(): Promise<void>;

  /**
   * UserPreferences part of the WonderPush SDK.
   * This is only available on Android. On other platforms the methods are implemented by nothing.
   */
  UserPreferences: UserPreferences;

  /**
   * Gets the user's country, either as previously stored, or as guessed from the system.
   * @returns {Promise<string>}
   */
  getCountry(): Promise<string>;

  /**
   * Overrides the user's country. You should use an ISO 3166-1 alpha-2 country code. Defaults to getting the country code from the system default locale.
   * Use `null` to disable the override.
   * @param {string} country
   * @returns {Promise<void>}
   */
  setCountry(country: string): Promise<void>;

  /**
   * Gets the user's currency, either as previously stored, or as guessed from the system.
   * @returns {Promise<string>}
   */
  getCurrency(): Promise<string>;

  /**
   * Overrides the user's currency. You should use an ISO 4217 currency code. Defaults to getting the currency code from the system default locale.
   * Use `null` to disable the override.
   * @param {string} currency -
   * @returns {Promise<void>}
   */
  setCurrency(currency: string): Promise<void>;

  /**
   * Gets the user's locale, either as previously stored, or as guessed from the system.
   * @returns {Promise<string>}
   */
  getLocale(): Promise<string>;

  /**
   * Overrides the user's locale.
   * You should use an `xx-XX` form of RFC 1766, composed of a lowercase ISO 639-1 language code, an underscore or a dash, and an uppercase ISO 3166-1 alpha-2 country code.
   * Defaults to getting the locale code from the system default locale.
   * Use `null` to disable the override.
   * @param {string} locale -
   * @returns {Promise<void>}
   */
  setLocale(locale: string): Promise<void>;

  /**
   * Gets the user's time zone, either as previously stored, or as guessed from the system.
   * @returns {Promise<string>}
   */
  getTimeZone(): Promise<string>;

  /**
   * You should use an IANA time zone database codes, `Continent/Country` style preferably, abbreviations like `CET`, `PST`, `UTC`, which have the drawback of changing on daylight saving transitions.
   * Defaults to getting the time zone code from the system default locale.
   * Use `null` to disable the override.
   * @param {string} timeZone -
   * @returns {Promise<void>}
   */
  setTimeZone(timeZone: string): Promise<void>;

  /**
   * Enables the collection of the user's geolocation.
   * @returns {Promise<void>}
   */
  enableGeolocation(): Promise<void>;

  /**
   * Disables the collection of the user's geolocation.
   * @returns {Promise<void>}
   */
  disableGeolocation(): Promise<void>;

  /**
   * Overrides the user's geolocation.
   * Using this method you can have the user's location be set to wherever you want.
   * This may be useful to use a pre-recorded location.
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<void>}
   */
  setGeolocation(latitude: number, longitude: number): Promise<void>;

}

export declare const WonderPush: WonderPushPlugin;
export default WonderPush;
