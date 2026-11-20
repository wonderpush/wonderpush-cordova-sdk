# wonderpush-cordova-sdk

Cordova plugin embedding the native WonderPush Android and iOS SDKs. Source of truth for the release steps: Trello card https://trello.com/c/GoqFLz0b/76-wonderpush-cordova-sdk (Wiki board, Deployment list). Keep this file and the card in sync when the procedure changes.

Always confirm with the user before any outward-facing step (push, tag push, `npm publish`, GitHub release, gh-pages push, ReadMe changelog).

## Upgrading the native SDKs

Release the native SDKs first (see `wonderpush-android-sdk` / `wonderpush-ios-sdk` CLAUDE.md) and wait until the Android one is live on Maven Central.

- Android SDK: `plugin.xml`, `<framework src="com.wonderpush:wonderpush-android-sdk:X.Y.Z" />` in the android platform.
- iOS SDK (Swift Package Manager): `src/ios/hooks/ProjectHelper.js`, `ProjectHelper.SPM_VERSION`.
- The CocoaPods entry (`<pod name="WonderPush" spec="4.4.3" nospm="true" />` in `plugin.xml`, and `ProjectHelper.POD_VERSION`) stays on 4.4.3: CocoaPods is no longer published, never bump it.
- FCM/HCM modules: `fcm/plugin.xml` / `hcm/plugin.xml` reference `com.wonderpush:wonderpush-android-sdk-fcm|hcm:X.Y.Z`; only bump them if those modules were released.
- Commit as `Upgrade native WonderPush Android SDK from A.B.C to X.Y.Z and iOS SDK from A.B.C to X.Y.Z`.

## Releasing the core plugin

If new methods were added: update `types/index.d.ts` before releasing and `@awesome-cordova-plugins/wonderpush` (our clone: https://github.com/wonderpush/awesome-cordova-plugins) after.

1. Bump the plugin version (the next patch, unless told otherwise) in `plugin.xml` (`version` attribute of `<plugin>`, line 2), `src/ios/WonderPushPlugin.m` (`setIntegrator`, ~line 206) and `src/android/WonderPushPlugin.java` (`setIntegrator`, ~line 54). `git add` them.
2. `npm version --force patch` (major/minor/patch): this updates `package.json`, commits and tags `vX.Y.Z`. Then `git branch -f latest HEAD`.
3. Docs: `npm install && rm -Rf doc/ && npm run doc`, then on `gh-pages`: `git fetch && git merge --ff-only origin/gh-pages`, `mv doc/wonderpush-cordova-sdk/$VERSION $VERSION`, `rm latest && ln -s $VERSION latest`, `git add latest $VERSION/` (never `node_modules`), commit `Documentation site for $VERSION`, back to `master`. The old Trello step `cp latest/api.html $VERSION/` is stale: that file does not exist in version folders.
4. Push: `git push origin gh-pages master latest v$VERSION`.
5. `npm publish`: needs 2FA (browser authentication or OTP), so the user must run it in their own terminal after `npm login`. The registry returns 404 for a few minutes after publishing; verify with `curl -s -o /dev/null -w '%{http_code}' https://registry.npmjs.org/wonderpush-cordova-sdk/$VERSION`.
6. GitHub release for tag `v$VERSION` (`gh release create v$VERSION --verify-tag`), bullet-list changelog in the style of previous releases.
7. ReadMe changelog: see "Announce on ReadMe" in `../wonderpush-sdks/CLAUDE.md` (REST API with `~/.readme-api-key`), title `[SDK][Cordova] Release vX.Y.Z`.

## Releasing the FCM / HCM modules

```bash
MODULE=fcm # or hcm
cd $MODULE
# bump the version attribute in plugin.xml, then package.json and package-lock.json
VERSION=x.y.z
git commit -m "Android $(echo $MODULE | tr a-z A-Z) $VERSION" plugin.xml package.json package-lock.json
git tag -a -m "Android $(echo $MODULE | tr a-z A-Z) $VERSION" ${MODULE}-v${VERSION}
git push origin master ${MODULE}-v${VERSION}
npm publish   # user runs it, 2FA
```

Then GitHub release for tag `${MODULE}-v${VERSION}` and a ReadMe changelog entry.

## Notes

- Untracked helper files `get.sh` and `cordova-plugin-maven-local.gradle` are the maintainer's, leave them alone.
- Last release done with this procedure: v3.6.3 (2026-11-20).
