class LogHelper {
  constructor(context) {
    this.context = context;
    this.events = this.context.requireCordovaModule('cordova-common').events;
  }
  debug(...args) {
    this.events.emit('verbose', ['[WonderPush]', ...args].join(' '));
  }
  warn(...args) {
    this.events.emit('warn', ['[WonderPush]', ...args].join(' '));
  }
  log(...args) {
    this.events.emit('log', ['[WonderPush]', ...args].join(' '));
  }
}

module.exports = LogHelper;