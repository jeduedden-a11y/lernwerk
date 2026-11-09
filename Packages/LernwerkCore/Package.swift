// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "LernwerkCore",
    defaultLocalization: "de",
    platforms: [.iOS(.v18), .macOS(.v14)],
    products: [
        .library(name: "LernwerkCore", targets: ["LernwerkCore"]),
    ],
    targets: [
        .target(name: "LernwerkCore", path: "Sources/LernwerkCore"),
        .testTarget(name: "LernwerkCoreTests", dependencies: ["LernwerkCore"], path: "Tests/LernwerkCoreTests"),
    ],
    swiftLanguageModes: [.v5]
)
