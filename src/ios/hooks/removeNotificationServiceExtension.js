const fs = require('fs-extra');
const path = require('path');
const ContextHelper = require('./ContextHelper');
const ProjectHelper = require('./ProjectHelper');

module.exports = function(context) {

  const contextHelper = new ContextHelper(context);

  // Start by removing PODFILE_SNIPPET from the Podfile
  return fs.exists(contextHelper.podfilePath)
    .then((exists) => {
      if (!exists) return;
      return fs.readFile(contextHelper.podfilePath)
        .then((buffer) => {
          const podfileContents = buffer.toString('utf8');
          if (podfileContents.indexOf(ProjectHelper.PODFILE_SNIPPET) >= 0) {
            return fs.writeFile(contextHelper.podfilePath, podfileContents.replace(ProjectHelper.PODFILE_SNIPPET, ''));
          }
        });
    })
    .then(() => {
      // Read the project
      return contextHelper.readXcodeProject()
        .catch((error) => {
          // Ignore
        })
        .then((project) => {
          if (!project) return;
          const projectHelper = new ProjectHelper(project);
          const target = projectHelper.findTargetByName(ProjectHelper.NOTIFICATION_SERVICE_EXTENSION_NAME);
          const buildFileKeys = new Set();
          const filePaths = new Set();

          // Configuration list and build configurations
          if (target && target.pbxNativeTarget && target.pbxNativeTarget.buildConfigurationList) {
            const buildConfigurationList = projectHelper.getBuildConfigurationListByKey(target.pbxNativeTarget.buildConfigurationList);
            if (buildConfigurationList) {
              // Remove the build configurations
              (buildConfigurationList.buildConfigurations || []).forEach(x => projectHelper.removeBuildConfigurationByKey(x.value));

              // Remove the build configuration list
              projectHelper.removeBuildConfigurationListByKey(target.pbxNativeTarget.buildConfigurationList);
            }
          }

          // Build phases
          if (target && target.pbxNativeTarget && target.pbxNativeTarget.buildPhases) {
            target.pbxNativeTarget.buildPhases.forEach(x => {
              const buildPhase = projectHelper.getBuildPhaseByKey(x.value);
              if (!buildPhase) return;
              for (const file of buildPhase.pbxBuildPhaseObj.files || []) {
                if (file.value) buildFileKeys.add(file.value);
              }
              // remove build phase
              projectHelper.removeBuildPhase(buildPhase.section, x.value);
            });
          }

          // Group
          const group = projectHelper.getGroupByName(ProjectHelper.NOTIFICATION_SERVICE_EXTENSION_NAME);
          const mainGroupId = projectHelper.getProjectMainGroupId();
          if (group) {

            // Remove the file refs
            for (const x of group.pbxGroup.children || []) {
              const childKey = x.value;

              const f = projectHelper.getFileByKey(childKey);
              if (f) {
                const p = path.join(
                  contextHelper.projectRoot, 'platforms', 'ios',
                  projectHelper.unquote(group.pbxGroup.path),
                  projectHelper.unquote(f.path));
                filePaths.add(p);
              }
              // Remove file
              projectHelper.removeFileByKey(childKey);

              // Collect all related build files
              const buildFileKey = projectHelper.getBuildFileKeyByFileRefKey(childKey);
              if (buildFileKey) buildFileKeys.add(buildFileKey);
            }

            // Remove the group from the main group
            projectHelper.removeKeyFromGroup(group.uuid, mainGroupId);

            // Remove the group
            projectHelper.removeGroupByKey(group.uuid);
          }

          // Remove the target
          projectHelper.removeTargetByKey(target.uuid);

          // Remove target from PBXProject section and PBXTargetDependency
          projectHelper.removeTargetFromAllProjects(target.uuid);
          projectHelper.removeTargetFromAllTargetDependencies(target.uuid);

          // Remove the build file
          const appexFile = projectHelper.findFileByName(`${ProjectHelper.NOTIFICATION_SERVICE_EXTENSION_NAME}.appex`);
          if (appexFile) {
            // Remove from Products group
            projectHelper.removeFileFromAllGroups(appexFile.uuid);

            // Remove from build files
            const buildFileKey = projectHelper.getBuildFileKeyByFileRefKey(appexFile.uuid);
            if (buildFileKey) buildFileKeys.add(buildFileKey);

            // Remove file
            projectHelper.removeFileByKey(appexFile.uuid);
          }

          // Remove the source files
          buildFileKeys.forEach((x) => projectHelper.removeBuildFileByKey(x));

          // Write the project
          fs.writeFileSync(project.filepath, project.writeSync());

          // Remove files on the hard drive
          return Promise.all(Array.from(filePaths)
            .map(x => fs.unlink(x)));
        })
    })

};