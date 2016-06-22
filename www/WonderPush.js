var _serviceName = 'WonderPushPlugin'
var _allowedPrefixes = 'byte short int long float double bool string date geoloc object ignore'
    .split(' ')
    .map(function (type) { return type + '_' })

function _errorHandler (error) {
  console.error('[WonderPush] error calling native method:', error)
}

function _callNative (actionName, args) {
  cordova.exec(null, _errorHandler, _serviceName, actionName, args || [])
}

function _isKeyAllowed (key) {
  return _allowedPrefixes.some(function (prefix) {
    return key.indexOf(prefix) === 0
  })
}

function _checkAllowedKeys (obj) {
  for (var key in obj) {
    if (!_isKeyAllowed(key)) {
      throw new Error('The key "' + key + '" is not allowed. Allowed prefixes for keys are: ' + _allowedPrefixes.join(', '))
    }
  }
}

function trackEvent (type, customData) {
  var args = [type]

  if (!type) {
    throw new Error('Missing event type')
  }

  if (customData) {
    _checkAllowedKeys(customData)

    args.push(customData)
  }

  _callNative('trackEvent', args)
}

function putInstallationCustomProperties (customProperties) {
  if (!customProperties) {
    throw new Error('Missing custom properties')
  }

  _checkAllowedKeys(customProperties)

  _callNative('putInstallationCustomProperties', [customProperties])
}

function setNotificationEnabled (enabled) {
  if (typeof enabled !== 'boolean') {
    throw new Error('Given parameter is not a boolean')
  }

  _callNative('setNotificationEnabled', [enabled])
}

var WonderPush = {
  initialize: function () { _callNative('initialize') },
  trackEvent: trackEvent,
  putInstallationCustomProperties: putInstallationCustomProperties,
  setNotificationEnabled: setNotificationEnabled
}

module.exports = WonderPush
