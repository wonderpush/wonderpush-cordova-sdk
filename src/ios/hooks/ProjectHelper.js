const path = require('path');

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
module.exports = ProjectHelper;