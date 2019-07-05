const fs = require('fs-extra');
const path = require('path');
const xcode = require('xcode');

const logMessage = (msg) => {
  console.log(`[WonderPush] ${msg}`);
};

const EXTENSION_TARGET_BUILD_SETTINGS = {
  Debug: {
    DEBUG_INFORMATION_FORMAT: 'dwarf',
    GCC_DYNAMIC_NO_PIC: 'NO',
    GCC_OPTIMIZATION_LEVEL:  0,
    GCC_PREPROCESSOR_DEFINITIONS: "(\n          \"DEBUG=1\",\n          \"$(inherited)\",\n        )",
    MTL_ENABLE_DEBUG_INFO: 'INCLUDE_SOURCE',
  },
  Release: {
    DEBUG_INFORMATION_FORMAT: '"dwarf-with-dsym"',
    ENABLE_NS_ASSERTIONS: 'NO',
    MTL_ENABLE_DEBUG_INFO: 'NO',
    VALIDATE_PRODUCT: 'YES',
  },
  Common: {
    ALWAYS_SEARCH_USER_PATHS: 'NO',
    CLANG_ANALYZER_NONNULL: 'YES',
    CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: 'YES_AGGRESSIVE',
    CLANG_CXX_LANGUAGE_STANDARD: '"gnu++14"',
    CLANG_CXX_LIBRARY: '"libc++"',
    CLANG_ENABLE_OBJC_WEAK: 'YES',
    CLANG_WARN_DIRECT_OBJC_ISA_USAGE: 'YES_ERROR',
    CLANG_WARN_DOCUMENTATION_COMMENTS: 'YES',
    CLANG_WARN_OBJC_ROOT_CLASS: 'YES_ERROR',
    CLANG_WARN_UNGUARDED_AVAILABILITY: 'YES_AGGRESSIVE',
    COPY_PHASE_STRIP: 'NO',
    GCC_C_LANGUAGE_STANDARD: 'gnu11',
    GCC_WARN_ABOUT_RETURN_TYPE: 'YES_ERROR',
    GCC_WARN_UNINITIALIZED_AUTOS: 'YES_AGGRESSIVE',
    IPHONEOS_DEPLOYMENT_TARGET: '10.0',
    MTL_ENABLE_DEBUG_INFO: 'NO',
    MTL_FAST_MATH: 'YES',
    SKIP_INSTALL: 'YES',
    TARGETED_DEVICE_FAMILY: '"1,2"',
  },
};

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
  get pluginId() {
    return this.context && this.context.opts && this.context.opts.plugin && this.context.opts.plugin.id || undefined;
  }
  get pluginDir() {
    return this.context && this.context.opts && this.context.opts.plugin && this.context.opts.plugin.dir || undefined;
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
}

class ProjectHelper {
  constructor(project) {
    this.project = project;
  }
  getAppExtensionTargets() {
    const nativeTargetSection = this.project.pbxNativeTargetSection();
    const serviceExtensionType = '"com.apple.product-type.app-extension"';
    return Object.values(nativeTargetSection || {})
      .filter((elt) => elt && elt.productType === serviceExtensionType);
  }

  /**
   * Returns the build configurations for the specified target
   * @param targetKey
   * @return Array
   */
  getTargetBuildConfigurations(targetKey) {
    const target = this.project.pbxNativeTargetSection()[targetKey];
    if (!target) return [];

    if (!target.buildConfigurationList) return [];

    const buildConfigurationList = this.project.pbxXCConfigurationList()[target.buildConfigurationList];
    if (!buildConfigurationList || !buildConfigurationList.buildConfigurations) return [];

    const buildConfigurationKeys = buildConfigurationList.buildConfigurations.map(x => x.value);
    return buildConfigurationKeys
      .map(x => this.project.pbxXCBuildConfigurationSection()[x])
      .filter(x => !!x);
  }

  /**
   * Returns the key of the first target of type Application
   * @returns {string | undefined}
   */
  getAppTargetKey() {
    // List app targets
    const pbxNativeTargetSection = this.project.pbxNativeTargetSection();
    return Object.keys(pbxNativeTargetSection)
      .find(x => pbxNativeTargetSection[x].productType === '"com.apple.product-type.application"');
  }

  getFileByKey(key) {
    const fileRefSection = this.project.pbxFileReferenceSection();
    return fileRefSection[key];
  }

  getBuildFileByKey(key) {
    const buildFileSection = this.project.pbxBuildFileSection();
    return buildFileSection[key];
  }
  getBuildFileKeyByFileRefKey(key) {
    const buildFileSection = this.project.pbxBuildFileSection();
    return Object.keys(buildFileSection)
      .find(x => typeof buildFileSection[x] === 'object' && buildFileSection[x].fileRef === key);
  }

  /**
   * Returns the bundle ID of the first app target for the specified environment
   * @param {'Debug' | 'Release'} environment
   * @return {string | undefined}
   */
  getAppBundleIdentifier(environment) {
    const appTargetKey = this.getAppTargetKey();
    if (!appTargetKey) return undefined;

    const buildConfiguration = this.getTargetBuildConfigurations(appTargetKey)
      .find(x => x.name === environment);

    return buildConfiguration
      && buildConfiguration.buildSettings
      && buildConfiguration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER
      || undefined;
  }
  
  getProjectMainGroupId() {
    const { project } = this;
    const rootObjectId = project.hash && project.hash.project && project.hash.project.rootObject || undefined;
    if (!rootObjectId) return undefined;

    const rootObject = project.pbxProjectSection()[rootObjectId];
    if (!rootObject) return undefined;

    return rootObject.mainGroup;
  }
  getBuildPhaseSection(name) {
    if (!this.project.hash.project.objects[name]) this.project.hash.objects[name] = {};
    return this.project.hash.project.objects[name];
  }

  addSourcesBuildPhase(fileKeys, target) {
    const buildPhase = {
      isa: 'PBXSourcesBuildPhase',
      buildActionMask: 2147483647,
      files: fileKeys.map(x => {
        const f = this.getFileByKey(x);
        const filepath = this.unquote(f.path);
        const buildFileKey = this.getBuildFileKeyByFileRefKey(x);
        if (!buildFileKey) return null;
        return {value: buildFileKey, comment: `${path.basename(filepath)} in Sources`};
      }),
      runOnlyForDeploymentPostprocessing: 0
    };
    const buildPhaseSection = this.getBuildPhaseSection('PBXSourcesBuildPhase');
    const buildPhaseUuid = this.project.generateUuid();
    buildPhaseSection[buildPhaseUuid] = buildPhase;
    target.pbxNativeTarget.buildPhases.push({
      value: buildPhaseUuid,
      comment: 'Sources',
    });
    return buildPhase;
  }

  unquote(str) {
    if (str) return str.replace(/^"(.*)"$/, "$1");
  }
}

module.exports = function(context) {

  const contextHelper = new ContextHelper(context);
  const ourServiceExtensionName = 'WonderPushNotificationServiceExtension';
  const pluginDir = contextHelper.pluginDir;
  const projectRoot = contextHelper.projectRoot;
  if (!pluginDir || !projectRoot) return;

  // Let's run only if ios is a platform
  if (!contextHelper.hasPlatform('ios')) return;

  return contextHelper.readXcodeProject()
    .then((project) => {
      const projectHelper = new ProjectHelper(project);
      const existingServiceExtensions = projectHelper.getAppExtensionTargets();

      // Message user if another extension that is not ours is found
      if (existingServiceExtensions.find(x => x.name !== ourServiceExtensionName)) logMessage('You already have a notification service extension. Please follow our guide to support rich push notifications: https://docs.wonderpush.com/docs/adding-a-notification-service-extension');

      // Exit right there
      if (existingServiceExtensions.length) return;

      // Copy files
      const source = path.join(pluginDir, 'src', 'ios', ourServiceExtensionName);
      const destination = path.join(projectRoot, 'platforms', 'ios', ourServiceExtensionName);

      return fs.copy(source, destination)
        .then(() => {

          // Let's add the extension
          const target = project.addTarget(ourServiceExtensionName, 'app_extension', ourServiceExtensionName);

          // Get this build configurations for the app
          const appTargetKey = projectHelper.getAppTargetKey();
          const appBuildConfigurations = projectHelper.getTargetBuildConfigurations(appTargetKey);

          // Get the build configuration for the extension
          const buildConfigurations = projectHelper.getTargetBuildConfigurations(target.uuid);
          for (const buildConfiguration of buildConfigurations) {
            const environment = buildConfiguration.name;

            // Copy CODE_SIGN* entries
            const correspondingAppBuildConfiguration = appBuildConfigurations.find(x => x.name === environment);
            if (correspondingAppBuildConfiguration && correspondingAppBuildConfiguration.buildSettings) {
              for (const key in correspondingAppBuildConfiguration.buildSettings) {
                if (key.startsWith("CODE_SIGN")) buildConfiguration.buildSettings[key] = correspondingAppBuildConfiguration.buildSettings[key];
              }
            }

            // Copy other build settings
            Object.assign(buildConfiguration.buildSettings, EXTENSION_TARGET_BUILD_SETTINGS.Common);
            Object.assign(buildConfiguration.buildSettings, EXTENSION_TARGET_BUILD_SETTINGS[environment]);

            // Copy bundle identifier
            const bundleIdentifier = projectHelper.getAppBundleIdentifier(environment);
            buildConfiguration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `${bundleIdentifier}.${ourServiceExtensionName}`;
          }

          // Create our group
          const filePaths = ['NotificationService.m', 'NotificationService.h', `${ourServiceExtensionName}-Info.plist`];
          const group = project.addPbxGroup(filePaths, ourServiceExtensionName, ourServiceExtensionName);

          // Add our group to the main group
          const mainGroupId = projectHelper.getProjectMainGroupId();
          if (!mainGroupId) throw  new Error('Could not find main group ID');
          project.addToPbxGroup(group.uuid, mainGroupId);

          // Only .m files
          const buildPhaseFileKeys = group.pbxGroup.children
            .filter(x => {
              const f = projectHelper.getFileByKey(x.value);
              return f && f.path && projectHelper.unquote(f.path).endsWith('.m');
            })
            .map(x => x.value);

          projectHelper.addSourcesBuildPhase(buildPhaseFileKeys, target);

          fs.writeFileSync(project.filepath, project.writeSync());
        });

    })
    .catch((err) => console.error(err))
};
