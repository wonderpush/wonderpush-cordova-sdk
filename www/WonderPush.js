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
 * This callback is called with a single string argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~StringArrayCallback
 * @param {string[]} value - The return value.
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
/**
 * This callback is called with a single argument of varying type when the call succeeds.
 * @callback cordova.plugins.WonderPush~MixedCallback
 * @param {*} value - The return value.
 */
/**
 * This callback is called with a single argument of varying type when the call succeeds.
 * @callback cordova.plugins.WonderPush~DelegateCallback
 * @param {?WonderPushDelegate} value - The return value.
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

_callNative('__setEventForwarder', [], function(event) {
  if (!event) return;
  switch (event.type) {
    case 'notificationOpen':
      cordova.fireDocumentEvent('wonderpush.notificationOpen', {
        notification: event.notification,
        notificationType: event.notificationType,
      })
      break
    case 'registeredCallback':
      cordova.fireDocumentEvent('wonderpush.registeredCallback', {
        method: event.method,
        arg: event.arg,
      })
      break
    default:
      console.warn('[WonderPush] Unknown native to JavaScript event of type ' + event.type, event);
      break
  }
})

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
 * Initializes the SDK, if you've opted to disable auto-initialization using the AUTO_INIT plugin variable.
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 */
function initialize (clientId, clientSecret, cb) {
  _callNative('initialize', [clientId, clientSecret], cb)
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

/**
 * @type {WonderPushDelegate}
 */
var currentDelegate = null

function delegateNativeCallback (call) {
  if (!call || !currentDelegate) {
    return
  }
  switch (call.method) {
    case 'urlForDeepLink': // fallthrough // Android name
    case 'wonderPushWillOpenURL': // iOS name
      currentDelegate.urlForDeepLink(call['url'], function(url) {
        _callNative('__callback', [call.__callbackId, url])
      })
      return
  }
}

/**
 * Sets up a delegate for tighter integration, or removes it.
 * @param {?WonderPushDelegate} delegate - The delegate to set, or `null` to remove it.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function setDelegate (delegate, cb) {
  cb = cb || function(){} // ensure cb is set to consume first result properly
  currentDelegate = delegate
  _callNative('setDelegate', [currentDelegate != null], function(call) {
    if (cb) {
      // Consuming first return
      cb()
      cb = null
    } else {
      // Forwarding successive calls
      delegateNativeCallback(call)
    }
  })
}

/**
 * Gets the current delegate for tighter integration.
 * @param {cordova.plugins.WonderPush~DelegateCallback} [cb] - The success callback called with the current delegate.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getDelegate (cb) {
    cb = cb || function(){} // ensure cb is set to consume first result properly
    cb(currentDelegate)
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
 * @param {?object} [attributes] - An object containing custom properties to be attached to the event.
 *   Prefer using a few custom properties over a plethora of event type variants.
 *
 *   The keys should be prefixed according to the type of their values.
 *   You can find the details in the [Concepts > Custom fields](https://www.wonderpush.com/docs/guide/custom-fields) section of the documentation.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function trackEvent (type, attributes, cb) {
  var args = [type]

  if (!type) {
    throw new Error('Missing event type')
  }

  if (attributes && !cb && typeof attributes === "function") {
    cb = attributes
    attributes = null
  }

  if (attributes) {
    _checkAllowedKeys(attributes)

    args.push(attributes)
  }

  _callNative('trackEvent', args, cb)
}

/**
 * Adds one or more tags to the installation.
 * @param {string|string[]} tag - The tags to add to the installation. You can use either a single string argument or an array of strings.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function addTag (tag, cb) {
  return _callNative('addTag', [tag], cb)
}

/**
 * Removes one or more tags from the installation.
 * @param {string|string[]} tag - The tags to remove from the installation. You can use either a single string argument or an array of strings.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function removeTag (tag, cb) {
  return _callNative('removeTag', [tag], cb)
}

/**
 * Removes all tags from the installation.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function removeAllTags (cb) {
  return _callNative('removeAllTags', [], cb)
}

/**
 * Returns all the tags of the installation.
 * @param {cordova.plugins.WonderPush~StringArrayCallback} [cb] - The callback called with an array of string tags.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getTags (cb) {
  return _callNative('getTags', [], cb)
}

/**
 * Tests whether the installation has the given tag attached to it.
 * @param {string} tag - The tag to test.
 * @param {cordova.plugins.WonderPush~BooleanCallback} [cb] - The callback called with `true` if the given tag is attached to the installation, `false` otherwise.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function hasTag (tag, cb) {
  return _callNative('hasTag', [tag], cb)
}

/**
 * Sets the value to a given installation property.
 *
 * The previous value is replaced entirely.
 * Setting `undefined` or `null` has the same effect as {@link cordova.plugins.WonderPush#unsetProperty}.
 *
 * @param {string} field - The name of the property to set
 * @param {mixed} value - The value to be set, can be an array
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function setProperty (field, value, cb) {
  return _callNative('setProperty', [field, value], cb)
};

/**
 * Removes the value of a given installation property.
 *
 * The previous value is replaced with `null`.
 *
 * @param {string} field - The name of the property to set
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function unsetProperty (field, cb) {
  return _callNative('unsetProperty', [field], cb)
};

/**
 * Adds the value to a given installation property.
 *
 * The stored value is made an array if not already one.
 * If the given value is an array, all its values are added.
 * If a value is already present in the stored value, it won't be added.
 *
 * @param {string} field - The name of the property to add values to
 * @param {*|Array.<*>|...*} value - The value(s) to be added, can be an array or multiple arguments
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function addProperty (field, value, cb) {
  return _callNative('addProperty', [field, value], cb)
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
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function removeProperty (field, value, cb) {
  return _callNative('removeProperty', [field, value], cb)
}

/**
 * Returns the value of a given installation property.
 *
 * If the property stores an array, only the first value is returned.
 * This way you don't have to deal with potential arrays if that property is not supposed to hold one.
 * Returns `null` if the property is absent or has an empty array value.
 *
 * @param {string} field - The name of the property to read values from
 * @param {cordova.plugins.WonderPush~MixedCallback} cb - Callback called with `null` or a single value stored in the property, never an array or `undefined`.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getPropertyValue (field, cb) {
  return _callNative('getPropertyValue', [field], function(wrappedValue) {
      cb && cb(wrappedValue.__wrapped);
  })
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
 * @param {cordova.plugins.WonderPush~MixedArrayCallback} cb - Callback called with a possibly empty array of the values stored in the property, but never `null` nor `undefined`
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getPropertyValues (field, cb) {
  return _callNative('getPropertyValues', [field], cb)
}

/**
 * Returns the latest known custom properties attached to the current installation object stored by WonderPush.
 * @param {cordova.plugins.WonderPush~ObjectCallback} cb - Callback called with the current installation custom properties.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getProperties (cb) {
  return _callNative('getProperties', [], cb)
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
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function putProperties (properties, cb) {
  if (!properties) {
    throw new Error('Missing properties')
  }

  _checkAllowedKeys(properties)

  _callNative('putProperties', [properties], cb)
}

/**
 * Returns the latest known custom properties attached to the current installation object stored by WonderPush.
 * @param {cordova.plugins.WonderPush~ObjectCallback} cb - Callback called with the current installation custom properties.
 * @memberof cordova.plugins.WonderPush
 * @instance
 * @deprecated
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
 * You can find the details in the [Segmentation > Properties](https://docs.wonderpush.com/docs/properties#section-custom-properties) section of the documentation.
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 * @deprecated
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
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function subscribeToNotifications (cb) {
  _callNative('subscribeToNotifications', [], cb)
}

/**
 * Returns whether the notifications are enabled.
 * @param {cordova.plugins.WonderPush~BooleanCallback} cb - Callback called with either `true` or false.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function isSubscribedToNotifications (cb) {
  _callNative('isSubscribedToNotifications', [], cb)
}

/**
 * Unsubscribes from push notification.
 *
 * This method marks the user as soft opt-out.
 *
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function unsubscribeFromNotifications (cb) {
  _callNative('unsubscribeFromNotifications', [], cb)
}

/**
 * Returns whether the notifications are enabled.
 * @param {cordova.plugins.WonderPush~BooleanCallback} cb - Callback called with either `true` or false.
 * @memberof cordova.plugins.WonderPush
 * @instance
 * @deprecated
 * @see cordova.plugins.WonderPush.isSubscribedToNotifications
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
 * @deprecated
 * @see cordova.plugins.WonderPush.subscribeToNotifications
 * @see cordova.plugins.WonderPush.unsubscribeFromNotifications
 */
function setNotificationEnabled (enabled, cb) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean')
  }

  _callNative('setNotificationEnabled', [enabled], cb)
}

///
/// Privacy
///

/**
 * Reads user consent state.
 * Returns undefined if no explicit consent was set.
 * @param {cordova.plugins.WonderPush~BooleanCallback} [cb] - The callback called with either true or false.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function getUserConsent (cb) {
  _callNative('getUserConsent', [], cb)
}

/**
 * Provides or withdraws user consent.
 * If the `requiresUserConsent` initialization option is true,
 * the whole SDK is paused and no data is sent to WonderPush, until consent is provided.
 * @param {boolean} consent -
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function setUserConsent (consent, cb) {
  _callNative('setUserConsent', [consent], cb)
}

/**
 * Remove any local storage and ask the WonderPush servers to delete any data associated with the all local installations and related users.
 *
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function clearAllData (cb) {
  _callNative('clearAllData', [], cb)
}

/**
 * Ask the WonderPush servers to delete any event associated with the all local installations.
 *
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function clearEventsHistory (cb) {
  _callNative('clearEventsHistory', [], cb)
}

/**
 * Ask the WonderPush servers to delete any custom data associated with the all local installations and related users.
 *
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function clearPreferences (cb) {
  _callNative('clearPreferences', [], cb)
}

/**
 * Initiates the download of all user remote and local data.
 *
 * @param {cordova.plugins.WonderPush~SuccessCallback} [cb] - The success callback.
 * @memberof cordova.plugins.WonderPush
 * @instance
 */
function downloadAllData (cb) {
  _callNative('downloadAllData', [], cb)
}

///
/// WonderPushUserPreferences
///

/**
 * @interface WonderPushChannel
 */

/**
 * Get the default channel id.
 * @param {cordova.plugins.WonderPush~StringCallback} cb
 */
function UserPreferences_getDefaultChannelId(cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_getDefaultChannelId', [], cb);
  } else {
    setTimeout(cb.bind(null, 'default'), 0);
  }
}

/**
 * Set the default channel id.
 * @param {string} id
 * @param {cordova.plugins.WonderPush~StringCallback} cb
 */
function UserPreferences_setDefaultChannelId(id, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_setDefaultChannelId', [id], cb);
  } else {
    setTimeout(cb, 0);
  }
}

/**
 * This callback is called with a single argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~WonderPushChannelGroupCallback
 * @param {?WonderPushChannelGroup} value - The return value.
 */
/**
 * Get a channel group.
 * @param {string} groupId
 * @param {cordova.plugins.WonderPush~WonderPushChannelCallback} cb
 */
function UserPreferences_getChannelGroup(groupId, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_getChannelGroup', [groupId], cb);
  } else {
    setTimeout(cb.bind(null, null), 0);
  }
}

/**
 * This callback is called with a single argument when the call succeeds.
 * @callback cordova.plugins.WonderPush~WonderPushChannelCallback
 * @param {?WonderPushChannel} value - The return value.
 */
/**
 * Get a channel.
 * @param {string} channelId
 * @param {cordova.plugins.WonderPush~WonderPushChannelCallback} cb
 */
function UserPreferences_getChannel(channelId, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_getChannel', [channelId], cb);
  } else {
    setTimeout(cb.bind(null, null), 0);
  }
}

/**
 * Create, update and remove channel existing groups to match the given channel groups.
 * @param {cordova.plugins.WonderPushChannelGroup[]} channelGroups
 * @param {cordova.plugins.WonderPush~SuccessCallback} cb
 */
function UserPreferences_setChannelGroups(channelGroups, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_setChannelGroups', [channelGroups], cb);
  } else {
    setTimeout(cb, 0);
  }
}

/**
 * Create, update and remove channels to match the given channels.
 * @param {cordova.plugins.WonderPushChannel[]} channels
 * @param {cordova.plugins.WonderPush~SuccessCallback} cb
 */
function UserPreferences_setChannels(channels, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_setChannels', [channels], cb);
  } else {
    setTimeout(cb, 0);
  }
}

/**
 * Create or update a channel group.
 * @param {cordova.plugins.WonderPushChannelGroup} channelGroup
 * @param {cordova.plugins.WonderPush~SuccessCallback} cb
 */
function UserPreferences_putChannelGroup(channelGroup, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_putChannelGroup', [channelGroup], cb);
  } else {
    setTimeout(cb, 0);
  }
}

/**
 * Create or update a channel.
 * @param {cordova.plugins.WonderPushChannel} channel
 * @param {cordova.plugins.WonderPush~SuccessCallback} cb
 */
function UserPreferences_putChannel(channel, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_putChannel', [channel], cb);
  } else {
    setTimeout(cb, 0);
  }
}

/**
 * Remove a channel group.
 * @param {string} channelId
 * @param {cordova.plugins.WonderPush~SuccessCallback} cb
 */
function UserPreferences_removeChannelGroup(groupId, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_removeChannelGroup', [groupId], cb);
  } else {
    setTimeout(cb, 0);
  }
}

/**
 * Remove a channel.
 * @param {string} channelId
 * @param {cordova.plugins.WonderPush~SuccessCallback} cb
 */
function UserPreferences_removeChannel(channelId, cb) {
  if (cordova.platformId === "android") {
    _callNative('UserPreferences_removeChannel', [channelId], cb);
  } else {
    setTimeout(cb, 0);
  }
}

///
/// Plugin interface
///

/**
 * Delegate interface
 * @interface cordova.plugins.WonderPushDelegate
 * @interface WonderPushDelegate
 */
function WonderPushDelegate () {}

/**
 * This callback is called with a single string argument when the call succeeds.
 * @callback cordova.plugins.WonderPushDelegate~UrlForDeepLinkCallback
 * @param {string?} url - The URL to open instead
 */
/**
 * @param {string} url - The URL to be opened
 * @param {cordova.plugins.WonderPushDelegate~UrlForDeepLinkCallback} cb - The callback to call with the URL to be opened
 */
WonderPushDelegate.prototype.urlForDeepLink = function (url, cb) {
  // Stub, no-op implementation
  cb(url);
}

/**
 * Main object of the WonderPush SDK.
 * @public
 * @namespace cordova.plugins.WonderPush {WonderPush}
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
  UserPreferences: {
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
  },
}

module.exports = WonderPush
