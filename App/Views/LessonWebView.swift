import SwiftUI
import UIKit
import WebKit
import LernwerkCore

/// Calls into the lesson runtime (window.LW) once the page has loaded.
@MainActor
final class LessonController {
    weak var webView: WKWebView?
    private var loaded = false
    private var queued: [String] = []

    func run(_ js: String) {
        guard loaded, let webView else { queued.append(js); return }
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    func didLoad() {
        loaded = true
        let pending = queued
        queued = []
        pending.forEach { run($0) }
    }

    func start(_ options: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: options), let json = String(data: data, encoding: .utf8) else { return }
        // trailing 0: LW.start returns a promise, which evaluateJavaScript cannot hand back
        run("LW.start(\(json)); 0")
    }

    func primary() { run("LW.primary(); 0") }
    func giveUp() { run("LW.giveUp(); 0") }
    func setInsets(top: CGFloat, bottom: CGFloat) { run("LW.setInsets({top: \(Int(top)), bottom: \(Int(bottom))}); 0") }
}

/// Serves lw://app/<path> from the synced content, falling back to the copy inside the app.
@MainActor
final class ContentSchemeHandler: NSObject, WKURLSchemeHandler {
    let locator: ContentLocator

    init(locator: ContentLocator) {
        self.locator = locator
    }

    nonisolated static func mime(_ name: String) -> String {
        switch (name as NSString).pathExtension.lowercased() {
        case "html", "htm": return "text/html"
        case "css": return "text/css"
        case "js": return "text/javascript"
        case "json": return "application/json"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        default: return "application/octet-stream"
        }
    }

    func webView(_ webView: WKWebView, start task: any WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        let rel = url.path.hasPrefix("/") ? String(url.path.dropFirst()) : url.path
        guard url.host == "app", let data = locator.data(rel) else {
            task.didFailWithError(URLError(.fileDoesNotExist))
            return
        }
        let mime = Self.mime(rel)
        let textual = mime.hasPrefix("text/") || mime.hasSuffix("json") || mime.hasSuffix("svg+xml")
        let headers = [
            "Content-Type": textual ? "\(mime); charset=utf-8" : mime,
            "Content-Length": String(data.count),
            "Cache-Control": "no-cache",
        ]
        let response: URLResponse = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)
            ?? URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: textual ? "utf-8" : nil)
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: any WKURLSchemeTask) {}
}

/// Forwards script messages without WKUserContentController keeping the coordinator alive.
@MainActor
final class WeakMessageProxy: NSObject, WKScriptMessageHandler {
    weak var target: (any WKScriptMessageHandler)?

    init(_ target: any WKScriptMessageHandler) {
        self.target = target
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        target?.userContentController(userContentController, didReceive: message)
    }
}

struct LessonWebView: UIViewRepresentable {
    let locator: ContentLocator
    let controller: LessonController
    let startOptions: [String: Any]
    let onMessage: (RuntimeMessage) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(controller: controller, startOptions: startOptions, onMessage: onMessage)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(ContentSchemeHandler(locator: locator), forURLScheme: "lw")
        let content = WKUserContentController()
        content.add(WeakMessageProxy(context.coordinator), name: "lw")
        config.userContentController = content
        config.dataDetectorTypes = []
        let web = WKWebView(frame: .zero, configuration: config)
        web.isOpaque = false
        web.backgroundColor = .clear
        web.scrollView.backgroundColor = .clear
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.keyboardDismissMode = .interactive
        web.allowsLinkPreview = false
        web.isInspectable = true
        web.navigationDelegate = context.coordinator
        controller.webView = web
        if let url = URL(string: "lw://app/runtime/index.html") { web.load(URLRequest(url: url)) }
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {
        context.coordinator.onMessage = onMessage
    }

    static func dismantleUIView(_ web: WKWebView, coordinator: Coordinator) {
        web.configuration.userContentController.removeScriptMessageHandler(forName: "lw")
    }

    @MainActor
    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        let controller: LessonController
        let startOptions: [String: Any]
        var onMessage: (RuntimeMessage) -> Void
        private var started = false

        init(controller: LessonController, startOptions: [String: Any], onMessage: @escaping (RuntimeMessage) -> Void) {
            self.controller = controller
            self.startOptions = startOptions
            self.onMessage = onMessage
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            onMessage(RuntimeMessage.parse(message.body))
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            controller.didLoad()
            guard !started else { return }
            started = true
            controller.start(startOptions)
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction) async -> WKNavigationActionPolicy {
            guard let url = action.request.url else { return .allow }
            if url.scheme == "http" || url.scheme == "https" || url.scheme == "mailto" {
                if action.navigationType == .linkActivated { _ = await UIApplication.shared.open(url) }
                return .cancel
            }
            return .allow
        }
    }
}
