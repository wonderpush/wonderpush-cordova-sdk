const path = require('path');
const fs = require('fs-extra');

class ProjectHelper {

  constructor(project) {
    this.project = project;
  }
  saveSync() {
    // Write the project
    fs.writeFileSync(this.project.filepath, this.project.writeSync());
  }
  getAppExtensionTargets() {
    const nativeTargetSection = this.project.pbxNativeTargetSection();
    const serviceExtensionType = '"com.apple.product-type.app-extension"';
    return Object.values(nativeTargetSection || {})
      .filter((elt) => elt && elt.productType === serviceExtensionType);
  }

  getBuildConfigurationListByKey(key) {
    return this.project.pbxXCConfigurationList()[key];
  }

  getBuildConfigurationByKey(key) {
    return this.project.pbxXCBuildConfigurationSection()[key];
  }

  removeBuildConfigurationByKey(key) {
    const pbxXCBuildConfigurationSection = this.project.pbxXCBuildConfigurationSection();
    const val = pbxXCBuildConfigurationSection[key];
    delete pbxXCBuildConfigurationSection[key];
    return val;
  }

  removeBuildConfigurationListByKey(key) {
    const pbxXCConfigurationList = this.project.pbxXCConfigurationList();
    const val = pbxXCConfigurationList[key];
    delete pbxXCConfigurationList[key];
    return val;
  }

  removeBuildConfigurationFromBuildConfigurationList(buildConfigurationKey, buildConfigurationListKey) {
    const buildConfigurationList = this.getBuildConfigurationListByKey(buildConfigurationListKey);
    if (!buildConfigurationList) return undefined;
    buildConfigurationList.buildConfigurations = buildConfigurationList.buildConfigurations
      .filter(x => x.value !== buildConfigurationKey);
    return buildConfigurationList;
  }

  addBuildConfiguration(key, buildConfiguration) {
    if (!key || !buildConfiguration) return;
    const pbxXCBuildConfigurationSection = this.project.pbxXCBuildConfigurationSection();
    pbxXCBuildConfigurationSection[key] = buildConfiguration;
    pbxXCBuildConfigurationSection[key + '_comment'] = buildConfiguration.name;
    return buildConfiguration;
  }

  addBuildConfigurationToBuildConfigurationList(buildConfigurationKey, buildConfigurationListKey) {
    const buildConfigurationList = this.getBuildConfigurationListByKey(buildConfigurationListKey);
    if (!buildConfigurationList) {
      return undefined;
    }
    const buildConfiguration = this.getBuildConfigurationByKey(buildConfigurationKey);
    if (!buildConfiguration) {
      return undefined;
    }
    buildConfigurationList.buildConfigurations.push({ value: buildConfigurationKey, comment: buildConfiguration.name });
    return buildConfigurationList;
  }

  getAllBuildConfigurations() {
    const result = [];
    const section = this.project.pbxXCBuildConfigurationSection();
    return Object.keys(section)
      .filter(x => !ProjectHelper.COMMENT_KEY.test(x))
      .map(uuid => ({ uuid, pbxXCBuildConfiguration: section[uuid]}));
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

    const buildConfigurationList = this.getBuildConfigurationListByKey(target.buildConfigurationList);
    if (!buildConfigurationList || !buildConfigurationList.buildConfigurations) return [];

    const buildConfigurationKeys = buildConfigurationList.buildConfigurations.map(x => x.value);
    return buildConfigurationKeys
      .map(uuid => ({
        uuid: uuid,
        pbxXCBuildConfiguration: this.getBuildConfigurationByKey(uuid),
      }))
      .filter(x => !!x && !!x.pbxXCBuildConfiguration);
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
  findFileByName(name) {
    const fileRefSection = this.project.pbxFileReferenceSection();
    const unquotedName = this.unquote(name);
    for (const key in fileRefSection) {
      const pbxFile = fileRefSection[key];
      if (typeof pbxFile !== 'object') continue;
      if (this.unquote(pbxFile.name) === unquotedName) return {
        uuid: key,
        pbxFile,
      }
    }
    return undefined;
  }
  removeFileByKey(key) {
    const fileRefSection = this.project.pbxFileReferenceSection();
    const val = fileRefSection[key];
    delete fileRefSection[key];
    return val;
  }

  removeFileFromAllGroups(key) {
    const groups = this.project.hash.project.objects['PBXGroup'];
    for (const groupKey in groups) {
      const group = groups[groupKey];
      if (typeof group !== 'object') continue;
      this.removeKeyFromGroup(key, groupKey);
    }
  }

  getBuildFileByKey(key) {
    const buildFileSection = this.project.pbxBuildFileSection();
    return buildFileSection[key];
  }
  removeBuildFileByKey(key) {
    const buildFileSection = this.project.pbxBuildFileSection();
    const buildFile = buildFileSection[key];
    delete buildFileSection[key];
    return buildFile;
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

    const targetBuildConfigurations = this.getTargetBuildConfigurations(appTargetKey);
    const buildConfiguration = targetBuildConfigurations
      .find(x => x.pbxXCBuildConfiguration.name === environment);

    return buildConfiguration
      && buildConfiguration.pbxXCBuildConfiguration.buildSettings
      && buildConfiguration.pbxXCBuildConfiguration.buildSettings.PRODUCT_BUNDLE_IDENTIFIER
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
  getGroupByName(name) {
    const groups = this.project.hash.project.objects['PBXGroup'];

    for (const key in groups) {
      // only look for comments
      if (!ProjectHelper.COMMENT_KEY.test(key)) continue;

      if (groups[key] === name) {
        const groupKey = key.split(ProjectHelper.COMMENT_KEY)[0];
        return {
          uuid: groupKey,
          pbxGroup: groups[groupKey],
        };
      }
    }
    return undefined;
  }
  removeKeyFromGroup(key, groupKey) {
    const group = this.getGroupByKey(groupKey);
    if (!group) return undefined;
    group.children = (group.children || []).filter(x => x.value !== key && x.value !== `comment_${key}`);
  }
  getGroupByKey(key) {
    const groups = this.project.hash.project.objects['PBXGroup'];
    return groups[key];
  }
  removeGroupByKey(key) {
    const groups = this.project.hash.project.objects['PBXGroup'];
    const group = groups[key];
    delete groups[key];
    return group;
  }
  getBuildPhaseSection(name) {
    if (!this.project.hash.project.objects[name]) this.project.hash.objects[name] = {};
    return this.project.hash.project.objects[name];
  }

  removeBuildPhase(sectionName, key) {
    const section = this.project.hash.project.objects[sectionName];
    if (!section) return undefined;
    const val = section[key];
    delete section[key];
    return val;
  }

  getBuildPhaseByKey(key) {
    const buildPhaseSections = [
      'PBXSourcesBuildPhase',
      'PBXResourcesBuildPhase',
      'PBXFrameworksBuildPhase',
      'PBXCopyFilesBuildPhase',
      'PBXCopyFilesBuildPhase',
      'PBXShellScriptBuildPhase',
    ];
    for (const buildPhaseSection of buildPhaseSections) {
      const section = this.project.hash.project.objects[buildPhaseSection];
      if (typeof section !== 'object') continue;
      const buildPhase = section[key];
      if (buildPhase) return {
        section: buildPhaseSection,
        pbxBuildPhaseObj: section[key],
      }
    }
    return undefined;
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
    return {
      uuid: buildPhaseUuid,
      pbxSourcesBuildPhase: buildPhase,
    };
  }

  unquote(str) {
    if (str) return str.replace(/^"(.*)"$/, "$1");
  }

  findTargetByName(name) {
    const pbxNativeTargetSection = this.project.pbxNativeTargetSection();
    for (const key in pbxNativeTargetSection) {
      const pbxNativeTarget = pbxNativeTargetSection[key];
      if (pbxNativeTarget.name === name) return {
        uuid: key,
        pbxNativeTarget,
      };
    }
    return undefined;
  }

  removeTargetByKey(key) {
    const pbxNativeTargetSection = this.project.pbxNativeTargetSection();
    const target = pbxNativeTargetSection[key];
    delete pbxNativeTargetSection[key];
    return target;
  }

  removeTargetFromAllProjects(key) {
    const projectsSection = this.project.hash.project.objects['PBXProject'];
    if (!projectsSection) return;
    for (const projectKey in projectsSection) {
      const project = projectsSection[projectKey];
      if (typeof project !== 'object') continue;
      project.targets = (project.targets || []).filter(x => x.value !== key);
    }
  }

  removeTargetFromAllTargetDependencies(key) {
    const dependenciesSection = this.project.hash.project.objects['PBXTargetDependency'];
    const proxySection = this.project.hash.project.objects['PBXContainerItemProxy'];
    for (const depKey of Object.keys(dependenciesSection)) {
      const dep = dependenciesSection[depKey];
      if (typeof dep !== 'object') continue;

      // Remove from dependencies
      if (dep.target && dep.target === key) {
        delete dependenciesSection[depKey];
        delete dependenciesSection[`${depKey}_comment`];

        // Remove from PBXContainerItemProxy
        if (dep.targetProxy) {
          delete proxySection[`${dep.targetProxy}_comment`];
          delete proxySection[dep.targetProxy];
        }
      }
    }
  }
}

ProjectHelper.POD_VERSION = '4.0.1';
ProjectHelper.PODFILE_SNIPPET = "target 'WonderPushNotificationServiceExtension' do\n" +
  "  platform :ios, '10.0'\n" +
  "  use_frameworks!\n" +
  "  pod 'WonderPushExtension', '" + ProjectHelper.POD_VERSION + "'\n" +
  "end\n";
ProjectHelper.NOTIFICATION_SERVICE_EXTENSION_NAME = 'WonderPushNotificationServiceExtension';
ProjectHelper.COMMENT_KEY = /_comment$/;

module.exports = ProjectHelper;
