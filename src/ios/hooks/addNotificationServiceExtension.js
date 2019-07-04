const fs = require('fs');
const path = require('path');
const xcode = require('xcode');

class ContextHelper {
  constructor(context) {
    this.context = context;
  }
  hasPlatform(platform) {
    const platforms = this.context && this.context.opts ? this.context.opts.platforms : undefined;
    if (!platforms) return false;
    return platforms.indexOf('ios') >= 0;
  }
  get projectRoot() {
    return this.context && this.context.opts && this.context.opts.projectRoot || undefined;
  }
  readConfig() {
    const projectRoot = this.projectRoot;
    if (!projectRoot) return Promise.reject(new Error('Missing project root'));
    if (!this.context) return Promise.reject(new Error('Missing context'));
    const cordovaCommon = this.context.requireCordovaModule('cordova-common');
    const configPath = path.join(projectRoot, 'config.xml');
    return new Promise((res, rej) => {
      fs.exists(configPath, (exists) => {
        if (!exists) rej(new Error('Missing config.xml file'));
        else res(new cordovaCommon.ConfigParser(configPath));
      });
    });
  }
  readXcodeProjectPath() {
    const projectRoot = this.projectRoot;
    if (!projectRoot) return Promise.reject(new Error('Missing project root'));
    return this.readConfig()
      .then((config) => {
        const name = config.name();
        const xcodeProjectPath = path.join(projectRoot, 'platforms', 'ios', `${name}.xcodeproj`);
        return new Promise((res, rej) => {
          fs.exists(xcodeProjectPath, (exists) => {
            if (exists) res(xcodeProjectPath);
            else rej(new Error(`${xcodeProjectPath}: no such file or directory`));
          });
        });
      })
  }
}



module.exports = function(context) {
  const contextHelper = new ContextHelper(context);

  // Let's run only if ios is a platform
  if (!contextHelper.hasPlatform('ios')) return;

  return contextHelper.readXcodeProjectPath()
    .then((xcodeProjectPath) => {
      const project = xcode.project(path.join(xcodeProjectPath, 'project.pbxproj'));
      console.log(project);
    })
    .catch((err) => console.error(err))
};
