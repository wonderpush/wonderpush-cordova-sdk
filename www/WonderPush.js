/**
 * This callback is called with no argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~SuccessCallback
 */
/**
 * This callback is called with a single boolean argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~BooleanCallback
 * @param {boolean} value - The return value.
 */
/**
 * This callback is called with a single string argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~StringCallback
 * @param {string} value - The return value.
 */
/**
 * This callback is called with a single nullable string argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~NullableStringCallback
 * @param {?string} value - The return value.
 */
/**
 * This callback is called with a single object argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~ObjectCallback
 * @param {object} value - The return value.
 */

///
/// Plugin helpers - Foreign interface
///

var _serviceName = 'WonderPushPlugin'

function _errorHandler (error) {
  console.error('[WonderPush] error calling native method:', error)
}

function _callNative (actionName, args, successCb, errorCb) {
  cordova.exec(successCb || null, errorCb || _errorHandler, _serviceName, actionName, args || [])
}

///
/// Plugin helpers - Custom properties
///

function _isKeyAllowed (key) {
  return _allowedPrefixes.some(function (prefix) {
    return key.indexOf(prefix) === 0
  })
}

var _allowedPrefixes = 'byte short int long float double bool string date geoloc object ignore'
    .split(' ')
    .map(function (type) { return type + '_' })

function _checkAllowedKeys (obj) {
  for (var key in obj) {
    if (!_isKeyAllowed(key)) {
      throw new Error('The key "' + key + '" is not allowed. Allowed prefixes for keys are: ' + _allowedPrefixes.join(', '))
    }
  }
}

///
/// Initialization
///

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
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function setUserId (userId, cb) {
  if (userId === null || userId === undefined) {
    userId = null
  } else if (typeof userId !== 'string') {
    throw new Error('Given parameter is neither a string nor null/undefined')
  }

  _callNative('setUserId', [userId], cb)
}

/**
 * Whether the SDK is ready to operate.
 *
 * The SDK is ready when it is initialized and has fetched an access token.
 * @param {cordova.plugins.WonderPush~BooleanCallback} cb - Callback called with `true` if the SDK is ready, `false` otherwise.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function isReady (cb) {
  _callNative('isReady', [], cb)
}

/**
 * Controls native SDK logging.
 * @param {boolean} enabled - Whether to enable logs.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function setLogging (enabled, cb) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean')
  }

  _callNative('setLogging', [enabled], cb)
}

///
/// Core information
///

/**
 * Returns the userId currently in use, `null` by default.
 * @param {cordova.plugins.WonderPush~NullableStringCallback} cb - Callback called with the current userId, which may be `null`.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getUserId (cb) {
  _callNative('getUserId', [], cb)
}

/**
 * Returns the installationId identifying your application on a device, bond to a specific userId.
 * If you want to store this information on your servers, keep the corresponding userId with it.
 * Will return `null` until the SDK is properly initialized.
 * @param {cordova.plugins.WonderPush~NullableStringCallback} cb - Callback called with the current installationId, which may be `null`.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getInstallationId (cb) {
  _callNative('getInstallationId', [], cb)
}

/**
 * Returns the unique device identifier
 * @param {cordova.plugins.WonderPush~StringCallback} cb - Callback called with the current deviceId.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getDeviceId (cb) {
  _callNative('getDeviceId', [], cb)
}

/**
 * Returns the push token.
 * Returns `null` if the user is not opt-in.
 * @param {cordova.plugins.WonderPush~NullableStringCallback} cb - Callback called with the push token, which may be `null`.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getPushToken (cb) {
  _callNative('getPushToken', [], cb)
}

/**
 * Returns the currently used access token.
 * Returns `null` until the SDK is properly initialized.
 * This together with your client secret gives entire control to the current installation and associated user, you should not disclose it unnecessarily.
 * @param {cordova.plugins.WonderPush~NullableStringCallback} cb - Callback called with the current access token, which may be `null`.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getAccessToken (cb) {
  _callNative('getAccessToken', [], cb)
}

///
/// Installation data and events
///

/**
 * Send an event to be tracked to WonderPush.
 *
 * @param {string} type - The event type, or name. Event types starting with an `@` character are reserved.
 * @param {?object} [data] - An object containing custom properties to be attached to the event.
 *   Prefer using a few custom properties over a plethora of event type variants.
 *
 *   The keys should be prefixed according to the type of their values.
 *   You can find the details in the [Concepts > Custom fields](https://www.wonderpush.com/docs/guide/custom-fields) section of the documentation.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function trackEvent (type, customData, cb) {
  var args = [type]

  if (!type) {
    throw new Error('Missing event type')
  }

  if (customData && !cb && typeof customData === "function") {
    cb = customData
    customData = null
  }

  if (customData) {
    _checkAllowedKeys(customData)

    args.push(customData)
  }

  _callNative('trackEvent', args, cb)
}

/**
 * Returns the latest known custom properties attached to the current installation object stored by WonderPush.
 * @param {cordova.plugins.WonderPush~ObjectCallback} cb - Callback called with the current installation custom properties.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getInstallationCustomProperties (cb) {
  return _callNative('getInstallationCustomProperties', [], cb)
}

/**
 * Updates the custom properties attached to the current installation object stored by WonderPush.
 *
 * In order to remove a value, use `null`.
 *
 * @param {object} customProperties - The partial object containing only the custom properties to update.
 *
 * The keys should be prefixed according to the type of their values.
 * You can find the details in the [Concepts > Custom fields](https://www.wonderpush.com/docs/guide/custom-fields) section of the documentation.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function putInstallationCustomProperties (customProperties, cb) {
  if (!customProperties) {
    throw new Error('Missing custom properties')
  }

  _checkAllowedKeys(customProperties)

  _callNative('putInstallationCustomProperties', [customProperties], cb)
}

///
/// Push notification handling
///

/**
 * Returns whether the notifications are enabled.
 * @param {cordova.plugins.WonderPush~BooleanCallback} cb - Callback called with either `true` or false.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getNotificationEnabled (cb) {
  _callNative('getNotificationEnabled', [], cb)
}

/**
 * Activates or deactivates the push notification on the device (if the user accepts for iOS) and registers the device token with WondePush.
 *
 * On iOS, you **must** call the following method at least once to make the user pushable.
 *
 * - You can call this method multiple times. The user is only prompted for permission by iOS once.
 * - Calling with `true` opts the user in, whether he was not opt-in or soft opt-out (by calling with `false`).
 * - There is no need to call this method if the permission has already been granted, but it does not harm either.
 * - If the permission has been denied on iOS, calling this method cannot opt the user back in as iOS leaves the user in control, through the system settings.
 *
 * Because in iOS you only have *one* chance for prompting the user, you should find a good timing for that.
 * For a start, you can systematically call it when the application starts, so that the user will be prompted directly at the first launch.
 *
 * @param {boolean} enabled - The new activation state of push notifications.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function setNotificationEnabled (enabled, cb) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean')
  }

  _callNative('setNotificationEnabled', [enabled], cb)
}

///
/// Plugin interface
///

/**
 * Main object of the WonderPush SDK.
 * @public
 * @namespace cordova.plugins.WonderPush {WonderPush}
 */
var WonderPush = {
  // Initialization
  setUserId: setUserId,
  isReady: isReady,
  setLogging: setLogging,
  // Core information
  getUserId: getUserId,
  getInstallationId: getInstallationId,
  getDeviceId: getDeviceId,
  getPushToken: getPushToken,
  getAccessToken: getAccessToken,
  // Installation data and events
  trackEvent: trackEvent,
  getInstallationCustomProperties: getInstallationCustomProperties,
  putInstallationCustomProperties: putInstallationCustomProperties,
  // Push notification handling
  getNotificationEnabled: getNotificationEnabled,
  setNotificationEnabled: setNotificationEnabled,
}

module.exports = WonderPush
