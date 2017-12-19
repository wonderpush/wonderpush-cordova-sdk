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

function setUserId (userId, cb) {
  if (userId === null || userId === undefined) {
    userId = null
  } else if (typeof userId !== 'string') {
    throw new Error('Given parameter is neither a string nor null/undefined')
  }

  _callNative('setUserId', [userId], cb)
}

function isReady (cb) {
  _callNative('isReady', [], cb)
}

function setLogging (enabled, cb) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean')
  }

  _callNative('setLogging', [enabled], cb)
}

///
/// Core information
///

function getUserId (cb) {
  _callNative('getUserId', [], cb)
}

function getInstallationId (cb) {
  _callNative('getInstallationId', [], cb)
}

function getDeviceId (cb) {
  _callNative('getDeviceId', [], cb)
}

function getPushToken (cb) {
  _callNative('getPushToken', [], cb)
}

function getAccessToken (cb) {
  _callNative('getAccessToken', [], cb)
}

///
/// Installation data and events
///

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

function getInstallationCustomProperties (cb) {
  return _callNative('getInstallationCustomProperties', [], cb)
}

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

function getNotificationEnabled (cb) {
  _callNative('getNotificationEnabled', [], cb)
}

function setNotificationEnabled (enabled, cb) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean')
  }

  _callNative('setNotificationEnabled', [enabled], cb)
}

///
/// Plugin interface
///

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
