const xcode = require('xcode');
const fs = require('fs-extra');
const path = require('path');

class ContextHelper {
  constructor(context) {
    this.context = context;
  }
  get projectRoot() {
    return this.context && this.context.opts && this.context.opts.projectRoot || undefined;
  }
  get pluginId() {
    return this.context && this.context.opts && this.context.opts.plugin && this.context.opts.plugin.id || undefined;
  }
  get pluginDir() {
    return this.context && this.context.opts && this.context.opts.plugin && this.context.opts.plugin.dir || undefined;
  }
  get podfilePath() {
    return this.projectRoot && path.join(this.projectRoot, 'platforms', 'ios', 'Podfile');
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
  readXcodeProject() {
    return this.readXcodeProjectPath()
      .then((xcodeProjectPath) => {
        const project = xcode.project(path.join(xcodeProjectPath, 'project.pbxproj'));
        return new Promise((res, rej) => {
          project.parse((err) => {
            if (err) rej(err);
            else res(project);
          });
        })
      })
  }
  runPodInstall() {
    const cordovaCommon = this.context.requireCordovaModule('cordova-common');
    const { superspawn } = cordovaCommon;
    const opts = {};
    opts.cwd = path.join(this.podfilePath, '..'); // parent path of this Podfile
    opts.stdio = 'pipe';
    opts.printCommand = true;
    return superspawn.spawn('pod', ['install', '--verbose'], opts)
      .progress(function (stdio) {
        if (stdio.stderr) { console.error(stdio.stderr); }
      });
  }
}
module.exports = ContextHelper;