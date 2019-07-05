const fs = require('fs-extra');
const path = require('path');
const ContextHelper = require('./ContextHelper');
const ProjectHelper = require('./ProjectHelper');

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

module.exports = function(context) {

  const contextHelper = new ContextHelper(context);
  const ourServiceExtensionName = ProjectHelper.NOTIFICATION_SERVICE_EXTENSION_NAME;
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

          // Add build phase to compile files
          projectHelper.addSourcesBuildPhase(buildPhaseFileKeys, target);

          // Write the project
          fs.writeFileSync(project.filepath, project.writeSync());

          // Read the Podfile
          return fs.readFile(contextHelper.podfilePath);
        })
        .then((buffer) => {
          const podfileContents = buffer.toString('utf8');
          if (podfileContents.indexOf(ProjectHelper.PODFILE_SNIPPET) < 0) {
            return fs.writeFile(contextHelper.podfilePath, podfileContents + "\n" + ProjectHelper.PODFILE_SNIPPET)
              .then(() => contextHelper.runPodInstall());
          }
        });

    })
    .catch((err) => console.error(err))
};
