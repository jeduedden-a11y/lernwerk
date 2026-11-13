import UIKit
import WebKit
import ObjectiveC

/// Math keys right on the keyboard of the lesson: minus, plus, slash, power, root, brackets, pi.
///
/// iOS shows only digits and a comma for number fields. WKWebView takes its keyboard accessory bar from an internal
/// content view, so the app gives that view a subclass at runtime whose inputAccessoryView is this bar. If the system
/// leaves the bar out (or WebKit changes), the lesson runtime shows the same keys as a row at the field instead.
enum MathKeyboard {
    nonisolated(unsafe) private static let barKey = UnsafeRawPointer(UnsafeMutableRawPointer.allocate(byteCount: 1, alignment: 1))

    @MainActor
    private static func contentView(of webView: WKWebView) -> UIView? {
        webView.scrollView.subviews.first { NSStringFromClass(type(of: $0)).contains("WKContent") }
    }

    /// Returns true when the bar is in place.
    @MainActor
    @discardableResult
    static func install(on webView: WKWebView, insert: @escaping (String) -> Void, done: @escaping () -> Void) -> Bool {
        guard let content = contentView(of: webView) else { return false }
        objc_setAssociatedObject(content, barKey, MathKeyBar(insert: insert, done: done), .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
        let base: AnyClass = type(of: content)
        let baseName = NSStringFromClass(base)
        if baseName.hasPrefix("LWMath_") { return true }
        let name = "LWMath_" + baseName
        if let existing = NSClassFromString(name) {
            object_setClass(content, existing)
            return true
        }
        let selector = #selector(getter: UIResponder.inputAccessoryView)
        guard let method = class_getInstanceMethod(UIView.self, selector),
              let sub = objc_allocateClassPair(base, name, 0) else { return false }
        let key = barKey
        let block: @convention(block) (AnyObject) -> UIView? = { object in
            objc_getAssociatedObject(object, key) as? UIView
        }
        class_addMethod(sub, selector, imp_implementationWithBlock(block), method_getTypeEncoding(method))
        objc_registerClassPair(sub)
        object_setClass(content, sub)
        return true
    }

    /// A field of the lesson has the keyboard.
    @MainActor
    static func isEditing(in webView: WKWebView) -> Bool {
        contentView(of: webView)?.isFirstResponder == true
    }

    /// The bar is on screen right now.
    @MainActor
    static func isShowing(in webView: WKWebView) -> Bool {
        guard let content = contentView(of: webView), let bar = objc_getAssociatedObject(content, barKey) as? UIView else { return false }
        return bar.window != nil && !bar.isHidden
    }
}

/// The bar itself: keyboard-style keys and »Fertig« to close the keyboard.
final class MathKeyBar: UIInputView, UIInputViewAudioFeedback {
    private let insert: (String) -> Void
    private let done: () -> Void

    var enableInputClicksWhenVisible: Bool { true }

    init(insert: @escaping (String) -> Void, done: @escaping () -> Void) {
        self.insert = insert
        self.done = done
        super.init(frame: CGRect(x: 0, y: 0, width: 390, height: 50), inputViewStyle: .keyboard)
        autoresizingMask = [.flexibleWidth]
        allowsSelfSizing = true

        let keys: [(title: String, text: String, name: String)] = [
            ("−", "-", "minus"), ("+", "+", "plus"), ("/", "/", "geteilt durch"), ("^", "^", "hoch"),
            ("√", "√", "Wurzel"), ("(", "(", "Klammer auf"), (")", ")", "Klammer zu"), ("π", "π", "pi"),
        ]
        let row = UIStackView()
        row.axis = .horizontal
        row.distribution = .fillEqually
        row.spacing = 5
        for key in keys {
            var config = UIButton.Configuration.gray()
            config.attributedTitle = AttributedString(key.title, attributes: AttributeContainer([.font: UIFont.systemFont(ofSize: 21, weight: .semibold)]))
            config.baseForegroundColor = .label
            config.cornerStyle = .medium
            config.contentInsets = NSDirectionalEdgeInsets(top: 4, leading: 0, bottom: 4, trailing: 0)
            let button = UIButton(configuration: config, primaryAction: UIAction { [weak self] _ in
                UIDevice.current.playInputClick()
                self?.insert(key.text)
            })
            button.accessibilityLabel = key.name
            row.addArrangedSubview(button)
        }
        var doneConfig = UIButton.Configuration.plain()
        doneConfig.attributedTitle = AttributedString("Fertig", attributes: AttributeContainer([.font: UIFont.systemFont(ofSize: 17, weight: .semibold)]))
        let doneButton = UIButton(configuration: doneConfig, primaryAction: UIAction { [weak self] _ in self?.done() })
        doneButton.setContentHuggingPriority(.required, for: .horizontal)
        doneButton.setContentCompressionResistancePriority(.required, for: .horizontal)

        let bar = UIStackView(arrangedSubviews: [row, doneButton])
        bar.axis = .horizontal
        bar.spacing = 8
        bar.alignment = .fill
        bar.translatesAutoresizingMaskIntoConstraints = false
        addSubview(bar)
        NSLayoutConstraint.activate([
            bar.leadingAnchor.constraint(equalTo: safeAreaLayoutGuide.leadingAnchor, constant: 6),
            bar.trailingAnchor.constraint(equalTo: safeAreaLayoutGuide.trailingAnchor, constant: -4),
            bar.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            bar.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -6),
            heightAnchor.constraint(equalToConstant: 50),
        ])
    }

    required init?(coder: NSCoder) { nil }
}
