// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "wonderpush-cordova-sdk",
    platforms: [
        .iOS(.v15),
    ],
    products: [
        .library(name: "wonderpush-cordova-sdk", targets: ["wonderpush-cordova-sdk"]),
    ],
    dependencies: [
        .package(url: "https://github.com/apache/cordova-ios.git", branch: "master"),
        .package(url: "https://github.com/wonderpush/wonderpush-ios-sdk.git", from: "4.5.1"),
    ],
    targets: [
        .target(
            name: "wonderpush-cordova-sdk",
            dependencies: [
                .product(name: "Cordova", package: "cordova-ios"),
                .product(name: "WonderPush", package: "wonderpush-ios-sdk"),
            ],
            path: "src/ios",
            exclude: [
                "hooks",
                "WonderPushNotificationServiceExtension",
            ],
            publicHeadersPath: "."
        ),
    ]
)
