/**
 * This callback is called with no argument when the call succeeds.
 * @callback WonderPush~SuccessCallback
 */
/**
 * This callback is called with an Error argument when the call fails.
 * @callback WonderPush~ErrorCallback
 */
/**
 * This callback is called with a single boolean argument when the call succeeds.
 * @callback WonderPush~BooleanCallback
 * @param {boolean} value - The return value.
 */
/**
 * This callback is called with a single string argument when the call succeeds.
 * @callback WonderPush~StringCallback
 * @param {string} value - The return value.
 */
/**
 * This callback is called with a single string argument when the call succeeds.
 * @callback WonderPush~StringArrayCallback
 * @param {string[]} value - The return value.
 */
/**
 * This callback is called with a single nullable string argument when the call succeeds.
 * @callback WonderPush~NullableStringCallback
 * @param {?string} value - The return value.
 */
/**
 * This callback is called with a single object argument when the call succeeds.
 * @callback WonderPush~ObjectCallback
 * @param {object} value - The return value.
 */
/**
 * This callback is called with a single argument of varying type when the call succeeds.
 * @callback WonderPush~MixedCallback
 * @param {*} value - The return value.
 */
/**
 * This callback is called with a single argument of varying type when the call succeeds.
 * @callback WonderPush~MixedArrayCallback
 * @param {Array<*>} value - The return value.
 */
/**
 * This callback is called with a single argument of varying type when the call succeeds.
 * @callback WonderPush~DelegateCallback
 * @param {?WonderPushDelegate} value - The return value.
 */

///
/// Plugin helpers - Foreign interface
///

var _serviceName = 'WonderPushPlugin';

function _makeDeferred(successCb, errorCb) {
  return new function() {
    this.success = null;
    this.failure = null;
    this.promise = new Promise(function(res, rej) {
      this.success = function() {
        if (typeof successCb === 'function') successCb.apply(null, arguments);
        res.apply(null, arguments);
      };
      this.failure = function() {
        console.error('[WonderPush] error calling native method:', arguments);
        if (typeof errorCb === 'function') errorCb.apply(null, arguments);
        rej.apply(null, arguments);
      };
    }.bind(this));
  }();
}

function _callNative(actionName, args, successCb, errorCb) {
  var deferred = _makeDeferred(successCb, errorCb);
  if (typeof cordova !== "undefined") {
    cordova.exec(deferred.success, deferred.failure, _serviceName, actionName, args || []);
  }
  return deferred.promise;
}

function _callCallbackReturnPromise(result, successCb) {
  var deferred = _makeDeferred(successCb);
  deferred.success(result);
  return deferred.promise;
}

_callNative('__setEventForwarder', [], function(event) {
  if (!event) return;
  if (typeof cordova === "undefined") {
    console.warn('[WonderPush] cordova is not defined, could not fireDocumentEvent', event);
    return;
  }
  switch (event.type) {
    case 'notificationOpen':
      /**
       * Triggered when a notification is clicked.
       * @event WonderPush#event:"wonderpush.notificationOpen"
       * @property {object} notification - The received notification.
       * @property {string} notificationType - The notification type, useful for filtering `"data"` notifications from the rest.
       */
      cordova.fireDocumentEvent('wonderpush.notificationOpen', {
        notification: event.notification,
        notificationType: event.notificationType,
      });
      break;
    case 'registeredCallback':
      /**
       * Registered callback
       * @event WonderPush#event:"wonderpush.registeredCallback"
       * @property {string} method - The registered callback name.
       * @property {string} arg - The argument provided.
       */
      cordova.fireDocumentEvent('wonderpush.registeredCallback', {
        method: event.method,
        arg: event.arg,
      });
      break;
    default:
      console.warn('[WonderPush] Unknown native to JavaScript event of type ' + event.type, event);
      break;
  }
});

///
/// Plugin helpers - Custom properties
///

function _isKeyAllowed(key) {
  return _allowedPrefixes.some(function(prefix) {
    return key.indexOf(prefix) === 0;
  })
}

var _allowedPrefixes = 'byte short int long float double bool string date geoloc object ignore'
    .split(' ')
    .map(function(type) { return type + '_' });

function _checkAllowedKeys(obj) {
  for (var key in obj) {
    if (!_isKeyAllowed(key)) {
      throw new Error('The key "' + key + '" is not allowed. Allowed prefixes for keys are: ' + _allowedPrefixes.join(', '));
    }
  }
}

///
/// Initialization
///

/**
 * Initializes the SDK, if you've opted to disable auto-initialization using the AUTO_INIT plugin variable.
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function initialize(clientId, clientSecret, onSuccess, onFailure) {
  return _callNative('initialize', [clientId, clientSecret], onSuccess, onFailure);
}

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
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setUserId(userId, onSuccess, onFailure) {
  if (userId === null || userId === undefined) {
    userId = null;
  } else if (typeof userId !== 'string') {
    throw new Error('Given parameter is neither a string nor null/undefined');
  }

  return _callNative('setUserId', [userId], onSuccess, onFailure);
}

/**
 * Whether the SDK is ready to operate.
 *
 * The SDK is ready when it is initialized and has fetched an access token.
 * @param {WonderPush~BooleanCallback} cb - Callback called with `true` if the SDK is ready, `false` otherwise.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function isReady(cb, onFailure) {
  return _callNative('isReady', [], cb, onFailure);
}

/**
 * Controls native SDK logging.
 * @param {boolean} enabled - Whether to enable logs.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setLogging(enabled, onSuccess, onFailure) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean');
  }

  return _callNative('setLogging', [enabled], onSuccess, onFailure);
}

/**
 * @type {WonderPushDelegate}
 * @private
 */
var currentDelegate = null;

function delegateNativeCallback(call) {
  if (!call || !currentDelegate) {
    return;
  }
  switch (call.method) {
    case 'urlForDeepLink': // fallthrough // Android name
    case 'wonderPushWillOpenURL': // iOS name
      currentDelegate.urlForDeepLink(call['url'], function(url) {
        _callNative('__callback', [call.__callbackId, url]);
      });
      return;
  }
}

/**
 * Sets up a delegate for tighter integration, or removes it.
 * @param {?WonderPushDelegate} delegate - The delegate to set, or `null` to remove it.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setDelegate(delegate, onSuccess, onFailure) {
  onSuccess = onSuccess || function(){}; // ensure cb is set to consume first result properly
  currentDelegate = delegate;
  return _callNative('setDelegate', [currentDelegate != null], function(call) {
    if (onSuccess) {
      // Consuming first return
      onSuccess();
      onSuccess = null;
    } else {
      // Forwarding successive calls
      delegateNativeCallback(call);
    }
  }, onFailure);
}

/**
 * Gets the current delegate for tighter integration.
 * @param {WonderPush~DelegateCallback} cb - Callback called with the current delegate.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getDelegate(cb, onFailure) {
    cb = cb || function(){}; // ensure cb is set to consume first result properly
    cb(currentDelegate);
}

///
/// Core information
///

/**
 * Returns the userId currently in use, `null` by default.
 * @param {WonderPush~NullableStringCallback} cb - Callback called with the current userId, which may be `null`.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getUserId(cb, onFailure) {
  return _callNative('getUserId', [], cb, onFailure);
}

/**
 * Returns the installationId identifying your application on a device, bond to a specific userId.
 * If you want to store this information on your servers, keep the corresponding userId with it.
 * Will return `null` until the SDK is properly initialized.
 * @param {WonderPush~NullableStringCallback} cb - Callback called with the current installationId, which may be `null`.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getInstallationId(cb, onFailure) {
  return _callNative('getInstallationId', [], cb, onFailure);
}

/**
 * Returns the unique device identifier
 * @param {WonderPush~StringCallback} cb - Callback called with the current deviceId.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getDeviceId(cb, onFailure) {
  return _callNative('getDeviceId', [], cb, onFailure);
}

/**
 * Returns the push token.
 * Returns `null` if the user is not opt-in.
 * @param {WonderPush~NullableStringCallback} cb - Callback called with the push token, which may be `null`.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getPushToken(cb, onFailure) {
  return _callNative('getPushToken', [], cb, onFailure);
}

/**
 * Returns the currently used access token.
 * Returns `null` until the SDK is properly initialized.
 * This together with your client secret gives entire control to the current installation and associated user, you should not disclose it unnecessarily.
 * @param {WonderPush~NullableStringCallback} cb - Callback called with the current access token, which may be `null`.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getAccessToken(cb, onFailure) {
  return _callNative('getAccessToken', [], cb, onFailure);
}

///
/// Installation data and events
///

/**
 * Send an event to be tracked to WonderPush.
 *
 * @param {string} type - The event type, or name. Event types starting with an `@` character are reserved.
 * @param {?object} [attributes] - An object containing custom properties to be attached to the event.
 *   Prefer using a few custom properties over a plethora of event type variants.
 *
 *   The keys should be prefixed according to the type of their values.
 *   You can find the details in the [Concepts > Custom fields](https://www.wonderpush.com/docs/guide/custom-fields) section of the documentation.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function trackEvent(type, attributes, onSuccess, onFailure) {
  var args = [type];

  if (!type) {
    throw new Error('Missing event type');
  }

  if (attributes && typeof attributes === "function") {
    onFailure = onSuccess;
    onSuccess = attributes;
    attributes = null;
  }

  if (attributes) {
    _checkAllowedKeys(attributes);

    args.push(attributes);
  }

  return _callNative('trackEvent', args, onSuccess, onFailure);
}

/**
 * Adds one or more tags to the installation.
 * @param {string|string[]} tag - The tags to add to the installation. You can use either a single string argument or an array of strings.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function addTag(tag, onSuccess, onFailure) {
  return _callNative('addTag', [tag], onSuccess, onFailure);
}

/**
 * Removes one or more tags from the installation.
 * @param {string|string[]} tag - The tags to remove from the installation. You can use either a single string argument or an array of strings.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function removeTag(tag, onSuccess, onFailure) {
  return _callNative('removeTag', [tag], onSuccess, onFailure);
}

/**
 * Removes all tags from the installation.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function removeAllTags(onSuccess, onFailure) {
  return _callNative('removeAllTags', [], onSuccess, onFailure);
}

/**
 * Returns all the tags of the installation.
 * @param {WonderPush~StringArrayCallback} cb - The callback called with an array of string tags.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getTags(cb, onFailure) {
  return _callNative('getTags', [], cb, onFailure);
}

/**
 * Tests whether the installation has the given tag attached to it.
 * @param {string} tag - The tag to test.
 * @param {WonderPush~BooleanCallback} cb - The callback called with `true` if the given tag is attached to the installation, `false` otherwise.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function hasTag(tag, cb, onFailure) {
  return _callNative('hasTag', [tag], cb, onFailure);
}

/**
 * Sets the value to a given installation property.
 *
 * The previous value is replaced entirely.
 * Setting `undefined` or `null` has the same effect as {@link WonderPush.unsetProperty}.
 *
 * @param {string} field - The name of the property to set
 * @param {mixed} value - The value to be set, can be an array
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setProperty(field, value, onSuccess, onFailure) {
  return _callNative('setProperty', [field, value], onSuccess, onFailure);
}

/**
 * Removes the value of a given installation property.
 *
 * The previous value is replaced with `null`.
 *
 * @param {string} field - The name of the property to set
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function unsetProperty(field, onSuccess, onFailure) {
  return _callNative('unsetProperty', [field], onSuccess, onFailure);
}

/**
 * Adds the value to a given installation property.
 *
 * The stored value is made an array if not already one.
 * If the given value is an array, all its values are added.
 * If a value is already present in the stored value, it won't be added.
 *
 * @param {string} field - The name of the property to add values to
 * @param {*|Array.<*>|...*} value - The value(s) to be added, can be an array or multiple arguments
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function addProperty(field, value, onSuccess, onFailure) {
  return _callNative('addProperty', [field, value], onSuccess, onFailure);
}

/**
 * Removes the value from a given installation property.
 *
 * The stored value is made an array if not already one.
 * If the given value is an array, all its values are removed.
 * If a value is present multiple times in the stored value, they will all be removed.
 *
 * @param {string} field - The name of the property to read values from
 * @param {*|Array.<*>|...*} value - The value(s) to be removed, can be an array or multiple arguments
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function removeProperty(field, value, onSuccess, onFailure) {
  return _callNative('removeProperty', [field, value], onSuccess, onFailure);
}

/**
 * Returns the value of a given installation property.
 *
 * If the property stores an array, only the first value is returned.
 * This way you don't have to deal with potential arrays if that property is not supposed to hold one.
 * Returns `null` if the property is absent or has an empty array value.
 *
 * @param {string} field - The name of the property to read values from
 * @param {WonderPush~MixedCallback} cb - Callback called with `null` or a single value stored in the property, never an array or `undefined`.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getPropertyValue(field, cb, onFailure) {
  return _callNative('getPropertyValue', [field], function(wrappedValue) {
      cb && cb(wrappedValue.__wrapped);
  }, onFailure)
}

/**
 * Returns an array of the values of a given installation property.
 *
 * If the property does not store an array, an array is returned nevertheless.
 * This way you don't have to deal with potential scalar values if that property is supposed to hold an array.
 * Returns an empty array instead of `null` if the property is absent.
 * Returns an array wrapping any scalar value held by the property.
 *
 * @param {string} field - The name of the property to read values from
 * @param {WonderPush~MixedArrayCallback} cb - Callback called with a possibly empty array of the values stored in the property, but never `null` nor `undefined`
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getPropertyValues(field, cb, onFailure) {
  return _callNative('getPropertyValues', [field], cb, onFailure);
}

/**
 * Returns the latest known custom properties attached to the current installation object stored by WonderPush.
 * @param {WonderPush~ObjectCallback} cb - Callback called with the current installation custom properties.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getProperties(cb, onFailure) {
  return _callNative('getProperties', [], cb, onFailure);
}

/**
 * Updates the properties attached to the current installation object stored by WonderPush.
 *
 * In order to remove a value, use `null`.
 *
 * @param {object} properties - The partial object containing only the custom properties to update.
 *
 * The keys should be prefixed according to the type of their values.
 * You can find the details in the [Segmentation > Properties](https://docs.wonderpush.com/docs/properties#section-custom-properties) section of the documentation.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function putProperties(properties, onSuccess, onFailure) {
  if (!properties) {
    throw new Error('Missing properties');
  }

  _checkAllowedKeys(properties);

  return _callNative('putProperties', [properties], onSuccess, onFailure);
}

/**
 * Returns the latest known custom properties attached to the current installation object stored by WonderPush.
 * @param {WonderPush~ObjectCallback} cb - Callback called with the current installation custom properties.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 * @deprecated
 * @see WonderPush.getProperties
 */
function getInstallationCustomProperties(cb, onFailure) {
  return _callNative('getInstallationCustomProperties', [], cb, onFailure);
}

/**
 * Updates the custom properties attached to the current installation object stored by WonderPush.
 *
 * In order to remove a value, use `null`.
 *
 * @param {object} customProperties - The partial object containing only the custom properties to update.
 *
 * The keys should be prefixed according to the type of their values.
 * You can find the details in the [Segmentation > Properties](https://docs.wonderpush.com/docs/properties#section-custom-properties) section of the documentation.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 * @deprecated
 * @see WonderPush.putProperties
 */
function putInstallationCustomProperties(customProperties, onSuccess, onFailure) {
  if (!customProperties) {
    throw new Error('Missing custom properties');
  }

  _checkAllowedKeys(customProperties);

  return _callNative('putInstallationCustomProperties', [customProperties], onSuccess, onFailure);
}

///
/// Push notification handling
///

/**
 * Subscribes to push notification and registers the device token with WondePush.
 *
 * On iOS and Android 13+, you **must** call the following method at least once to make the notification visible to the user.
 *
 * - You can call this method multiple times. The user is only prompted for permission by the OS once.
 * - There is no need to call this method if the permission has already been granted, but it does not harm either.
 * - If the permission has been denied in the OS, the user will stay soft opt-out.
 *
 * Because the OS will only let you have *one* chance for prompting the user, you should find a good timing for that.
 * For a start, you can systematically call it when the application starts, so that the user will be prompted directly at the first launch.
 *
 * About Android 13+: If you want to control when the user is prompted, you also need to update your `config.xml` and add:
 * `<preference name="android-targetSdkVersion" value="33" />` inside `<platform name="android">`.
 * Otherwise the user will be prompted when the application launches.
 *
 * @param {boolean} [fallbackToSettings] - On Android, shows a dialog that leads user to the settings should he refuse the permission.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function subscribeToNotifications(fallbackToSettings, onSuccess, onFailure) {
  if (typeof fallbackToSettings == 'function') {
    onFailure = onSuccess;
    onSuccess = fallbackToSettings;
    fallbackToSettings = false;
  }
  return _callNative('subscribeToNotifications', [fallbackToSettings], onSuccess, onFailure);
}

/**
 * Returns whether the notifications are enabled.
 * @param {WonderPush~BooleanCallback} cb - Callback called with either `true` or false.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function isSubscribedToNotifications(cb, onFailure) {
  return _callNative('isSubscribedToNotifications', [], cb, onFailure);
}

/**
 * Unsubscribes from push notification.
 *
 * This method marks the user as soft opt-out.
 *
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function unsubscribeFromNotifications(onSuccess, onFailure) {
  return _callNative('unsubscribeFromNotifications', [], onSuccess, onFailure);
}

/**
 * Returns whether the notifications are enabled.
 * @param {WonderPush~BooleanCallback} cb - Callback called with either `true` or false.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 * @deprecated
 * @see WonderPush.isSubscribedToNotifications
 */
function getNotificationEnabled(cb, onFailure) {
  return _callNative('getNotificationEnabled', [], cb, onFailure);
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
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 * @deprecated
 * @see WonderPush.subscribeToNotifications
 * @see WonderPush.unsubscribeFromNotifications
 */
function setNotificationEnabled(enabled, onSuccess, onFailure) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean');
  }

  return _callNative('setNotificationEnabled', [enabled], onSuccess, onFailure);
}

///
/// Privacy
///

/**
 * Reads user consent state.
 * Returns undefined if no explicit consent was set.
 * @param {WonderPush~BooleanCallback} cb - The callback called with either true or false.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getUserConsent(cb, onFailure) {
  return _callNative('getUserConsent', [], cb, onFailure);
}

/**
 * Provides or withdraws user consent.
 * If the `requiresUserConsent` initialization option is true,
 * the whole SDK is paused and no data is sent to WonderPush, until consent is provided.
 * @param {boolean} consent -
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setUserConsent(consent, onSuccess, onFailure) {
  return _callNative('setUserConsent', [consent], onSuccess, onFailure);
}

/**
 * Remove any local storage and ask the WonderPush servers to delete any data associated with the all local installations and related users.
 *
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function clearAllData(onSuccess, onFailure) {
  return _callNative('clearAllData', [], onSuccess, onFailure);
}

/**
 * Ask the WonderPush servers to delete any event associated with the all local installations.
 *
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function clearEventsHistory(onSuccess, onFailure) {
  return _callNative('clearEventsHistory', [], onSuccess, onFailure);
}

/**
 * Ask the WonderPush servers to delete any custom data associated with the all local installations and related users.
 *
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function clearPreferences(onSuccess, onFailure) {
  return _callNative('clearPreferences', [], onSuccess, onFailure);
}

/**
 * Initiates the download of all user remote and local data.
 *
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function downloadAllData(onSuccess, onFailure) {
  return _callNative('downloadAllData', [], onSuccess, onFailure);
}

/**
 * Gets the user's country, either as previously stored, or as guessed from the system.
 * @param {WonderPush~StringCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getCountry(cb, onFailure) {
  return _callNative('getCountry', [], cb, onFailure);
}

/**
 * Overrides the user's country. You should use an ISO 3166-1 alpha-2 country code. Defaults to getting the country code from the system default locale.
 * Use `null` to disable the override.
 * @param {string} country -
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setCountry(country, onSuccess, onFailure) {
  return _callNative('setCountry', [country], onSuccess, onFailure);
}

/**
 * Gets the user's currency, either as previously stored, or as guessed from the system.
 * @param {WonderPush~StringCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getCurrency(cb, onFailure) {
  return _callNative('getCurrency', [], cb, onFailure);
}

/**
 * Overrides the user's currency. You should use an ISO 4217 currency code. Defaults to getting the currency code from the system default locale.
 * Use `null` to disable the override.
 * @param {string} currency -
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setCurrency(currency, onSuccess, onFailure) {
  return _callNative('setCurrency', [currency], onSuccess, onFailure);
}

/**
 * Gets the user's locale, either as previously stored, or as guessed from the system.
 * @param {WonderPush~StringCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getLocale(cb, onFailure) {
  return _callNative('getLocale', [], cb, onFailure);
}

/**
 * Overrides the user's locale.
 * You should use an `xx-XX` form of RFC 1766, composed of a lowercase ISO 639-1 language code, an underscore or a dash, and an uppercase ISO 3166-1 alpha-2 country code.
 * Defaults to getting the locale code from the system default locale.
 * Use `null` to disable the override.
 * @param {string} locale -
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setLocale(locale, onSuccess, onFailure) {
  return _callNative('setLocale', [locale], onSuccess, onFailure);
}

/**
 * Gets the user's time zone, either as previously stored, or as guessed from the system.
 * @param {WonderPush~StringCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function getTimeZone(cb, onFailure) {
  return _callNative('getTimeZone', [], cb, onFailure);
}

/**
 * You should use an IANA time zone database codes, `Continent/Country` style preferably, abbreviations like `CET`, `PST`, `UTC`, which have the drawback of changing on daylight saving transitions.
 * Defaults to getting the time zone code from the system default locale.
 * Use `null` to disable the override.
 * @param {string} timeZone -
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setTimeZone(timeZone, onSuccess, onFailure) {
  return _callNative('setTimeZone', [timeZone], onSuccess, onFailure);
}

/**
 * Enables the collection of the user's geolocation.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function enableGeolocation(onSuccess, onFailure) {
  return _callNative('enableGeolocation', [], onSuccess, onFailure);
}

/**
 * Disables the collection of the user's geolocation.
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function disableGeolocation(onSuccess, onFailure) {
  return _callNative('disableGeolocation', [], onSuccess, onFailure);
}

/**
 * Overrides the user's geolocation.
 * Using this method you can have the user's location be set to wherever you want.
 * This may be useful to use a pre-recorded location.
 * @param {number} latitude
 * @param {number} longitude
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @memberof WonderPush
 */
function setGeolocation(latitude, longitude, onSuccess, onFailure) {
  return _callNative('setGeolocation', [latitude, longitude], onSuccess, onFailure);
}

///
/// WonderPushUserPreferences
///

/**
 * @interface WonderPushChannelGroup
 * @property {string} id - The id of this group.
 * @property {string} name - The user visible name of this group.
 */
/**
 * @interface WonderPushChannel
 * @property {string} id - The id of the group this channel belongs to, if any.
 * @property {string} name - The user visible name of this channel.
 * @property {string} description - The user visible description of this channel.
 * @property {boolean} bypassDnd - Whether or not notifications posted to this channel can bypass the Do Not Disturb mode.
 * @property {boolean} showBadge - Whether notifications posted to this channel can appear as application icon badges in a Launcher.
 * @property {number} importance - The user specified importance for notifications posted to this channel.
 * @property {boolean} lights - Whether notifications posted to this channel should display notification lights.
 * @property {boolean} vibrate - Whether notifications posted to this channel always vibrate.
 * @property {number[]} vibrationPattern - The vibration pattern for notifications posted to this channel.
 * @property {number} lightColor - The notification light color for notifications posted to this channel.
 * @property {number} lockscreenVisibility - Whether or not notifications posted to this channel are shown on the lockscreen in full or redacted form.
 * @property {boolean} sound - Whether a sound should be played for notifications posted to this channel.
 * @property {string} soundUri - The notification sound for this channel.
 * @property {boolean} vibrateInSilentMode - Whether notifications posted to this channel vibrate if the device is in silent mode.
 * @property {number} color - The color to impose on all notifications posted to this channel.
 * @property {boolean} localOnly - Whether notifications posted to this channel should be local to this device.
 */

/**
 * Get the default channel id.
 * @param {WonderPush~StringCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.getDefaultChannelId
 */
function UserPreferences_getDefaultChannelId(cb, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    _callNative('UserPreferences_getDefaultChannelId', [], cb, onFailure);
  } else {
    return _callCallbackReturnPromise('default', cb);
  }
}

/**
 * Set the default channel id.
 * @param {string} id
 * @param {WonderPush~StringCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.setDefaultChannelId
 */
function UserPreferences_setDefaultChannelId(id, cb, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_setDefaultChannelId', [id], cb, onFailure);
  } else {
    return _callCallbackReturnPromise(undefined, cb);
  }
}

/**
 * This callback is called with a single argument when the call succeeds.
 * @callback WonderPush~WonderPushChannelGroupCallback
 * @param {?WonderPushChannelGroup} value - The return value.
 */
/**
 * Get a channel group.
 * @param {string} groupId
 * @param {WonderPush~WonderPushChannelCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.getChannelGroups
 */
function UserPreferences_getChannelGroup(groupId, cb, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_getChannelGroup', [groupId], cb, onFailure);
  } else {
    return _callCallbackReturnPromise(null, cb);
  }
}

/**
 * This callback is called with a single argument when the call succeeds.
 * @callback WonderPush~WonderPushChannelCallback
 * @param {?WonderPushChannel} value - The return value.
 */
/**
 * Get a channel.
 * @param {string} channelId
 * @param {WonderPush~WonderPushChannelCallback} cb
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.getChannel
 */
function UserPreferences_getChannel(channelId, cb, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_getChannel', [channelId], cb, onFailure);
  } else {
    return _callCallbackReturnPromise(null, cb);
  }
}

/**
 * Create, update and remove channel existing groups to match the given channel groups.
 * @param {WonderPushChannelGroup[]} channelGroups
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.setChannelGroups
 */
function UserPreferences_setChannelGroups(channelGroups, onSuccess, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_setChannelGroups', [channelGroups], onSuccess, onFailure);
  } else {
    return _callCallbackReturnPromise(undefined, onSuccess);
  }
}

/**
 * Create, update and remove channels to match the given channels.
 * @param {WonderPushChannel[]} channels
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.setChannels
 */
function UserPreferences_setChannels(channels, onSuccess, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_setChannels', [channels], onSuccess, onFailure);
  } else {
    return _callCallbackReturnPromise(undefined, onSuccess);
  }
}

/**
 * Create or update a channel group.
 * @param {WonderPushChannelGroup} channelGroup
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.putChannelGroup
 */
function UserPreferences_putChannelGroup(channelGroup, onSuccess, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_putChannelGroup', [channelGroup], onSuccess, onFailure);
  } else {
    return _callCallbackReturnPromise(undefined, onSuccess);
  }
}

/**
 * Create or update a channel.
 * @param {WonderPushChannel} channel
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.putChannel
 */
function UserPreferences_putChannel(channel, onSuccess, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_putChannel', [channel], onSuccess, onFailure);
  } else {
    return _callCallbackReturnPromise(undefined, onSuccess);
  }
}

/**
 * Remove a channel group.
 * @param {string} groupId
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.removeChannelGroup
 */
function UserPreferences_removeChannelGroup(groupId, onSuccess, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_removeChannelGroup', [groupId], onSuccess, onFailure);
  } else {
    return _callCallbackReturnPromise(undefined, onSuccess);
  }
}

/**
 * Remove a channel.
 * @param {string} channelId
 * @param {WonderPush~SuccessCallback} [onSuccess] - The success callback.
 * @param {WonderPush~ErrorCallback} [onFailure] - The failure callback.
 * @alias WonderPush.UserPreferences.removeChannel
 */
function UserPreferences_removeChannel(channelId, onSuccess, onFailure) {
  if (typeof cordova !== "undefined" && cordova.platformId === "android") {
    return _callNative('UserPreferences_removeChannel', [channelId], onSuccess, onFailure);
  } else {
    return _callCallbackReturnPromise(undefined, onSuccess);
  }
}

///
/// Plugin interface
///

/**
 * Delegate interface
 * @interface WonderPushDelegate
 * @interface WonderPushDelegate
 */
function WonderPushDelegate() {}

/**
 * This callback is called with a single string argument when the call succeeds.
 * @callback WonderPushDelegate~UrlForDeepLinkCallback
 * @param {string?} url - The URL to open instead, or `null` to avoid opening anything.
 */
/**
 * @param {string} url - The URL to be opened
 * @param {WonderPushDelegate~UrlForDeepLinkCallback} cb - The callback to call with the URL to open instead.
 */
WonderPushDelegate.prototype.urlForDeepLink = function(url, cb) {
  // Stub, no-op implementation
  cb(url);
};

/**
 * UserPreferences part of the WonderPush SDK.
 * @public
 * @namespace WonderPush.UserPreferences
 */
var UserPreferences = {
  getDefaultChannelId: UserPreferences_getDefaultChannelId,
  setDefaultChannelId: UserPreferences_setDefaultChannelId,
  getChannelGroup: UserPreferences_getChannelGroup,
  getChannel: UserPreferences_getChannel,
  setChannelGroups: UserPreferences_setChannelGroups,
  setChannels: UserPreferences_setChannels,
  putChannelGroup: UserPreferences_putChannelGroup,
  putChannel: UserPreferences_putChannel,
  removeChannelGroup: UserPreferences_removeChannelGroup,
  removeChannel: UserPreferences_removeChannel,
};

/**
 * Main object of the WonderPush SDK.
 * @public
 * @namespace WonderPush {WonderPush}
 */
var WonderPush = {
  // Initialization
  initialize: initialize,
  setUserId: setUserId,
  isReady: isReady,
  setLogging: setLogging,
  setDelegate: setDelegate,
  getDelegate: getDelegate,
  // Core information
  getUserId: getUserId,
  getInstallationId: getInstallationId,
  getDeviceId: getDeviceId,
  getPushToken: getPushToken,
  getAccessToken: getAccessToken,
  // Installation data and events
  trackEvent: trackEvent,
  addTag: addTag,
  removeTag: removeTag,
  removeAllTags: removeAllTags,
  getTags: getTags,
  hasTag: hasTag,
  setProperty: setProperty,
  unsetProperty: unsetProperty,
  addProperty: addProperty,
  removeProperty: removeProperty,
  getPropertyValue: getPropertyValue,
  getPropertyValues: getPropertyValues,
  getProperties: getProperties,
  putProperties: putProperties,
  getInstallationCustomProperties: getInstallationCustomProperties,
  putInstallationCustomProperties: putInstallationCustomProperties,
  // Push notification handling
  subscribeToNotifications: subscribeToNotifications,
  isSubscribedToNotifications: isSubscribedToNotifications,
  unsubscribeFromNotifications: unsubscribeFromNotifications,
  getNotificationEnabled: getNotificationEnabled,
  setNotificationEnabled: setNotificationEnabled,
  // Privacy
  getUserConsent: getUserConsent,
  setUserConsent: setUserConsent,
  clearAllData: clearAllData,
  clearEventsHistory: clearEventsHistory,
  clearPreferences: clearPreferences,
  downloadAllData: downloadAllData,
  // UserPreferences (Android only, safe no-op on other platforms)
  UserPreferences: UserPreferences,
  getCountry: getCountry,
  setCountry: setCountry,
  getCurrency: getCurrency,
  setCurrency: setCurrency,
  getTimeZone: getTimeZone,
  setTimeZone: setTimeZone,
  getLocale: getLocale,
  setLocale: setLocale,
  setGeolocation: setGeolocation,
  enableGeolocation: enableGeolocation,
  disableGeolocation: disableGeolocation,
};

module.exports = WonderPush;
