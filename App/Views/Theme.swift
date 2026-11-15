import SwiftUI
import LernwerkCore

let germanLocale = Locale(identifier: "de_DE")

extension Color {
    /// "#5E5CE6" or "5E5CE6"; falls back to system gray.
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else {
            self.init(.sRGB, red: 0.56, green: 0.56, blue: 0.58, opacity: 1)
            return
        }
        self.init(.sRGB, red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255, opacity: 1)
    }
}

extension Color {
    /// The bright variant of a pigment for dark surfaces: same hue, a little less saturation, and as bright as every
    /// other pigment (relative luminance about 0.4), so no colour shouts and none sinks into the black.
    static func glow(_ hex: String) -> Color {
        var h: CGFloat = 0, s: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        guard UIColor(Color(hex: hex)).getHue(&h, saturation: &s, brightness: &b, alpha: &a) else { return Color(hex: hex) }
        let sat = s * 0.78
        var lo = b, hi: CGFloat = 1
        for _ in 0..<14 {
            let mid = (lo + hi) / 2
            if luminance(hue: h, saturation: sat, brightness: mid) < 0.4 { lo = mid } else { hi = mid }
        }
        return Color(hue: Double(h), saturation: Double(sat), brightness: Double((lo + hi) / 2))
    }

    /// Relative luminance (WCAG) of a colour given in hue, saturation and brightness.
    private static func luminance(hue: CGFloat, saturation: CGFloat, brightness: CGFloat) -> CGFloat {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        UIColor(hue: hue, saturation: saturation, brightness: brightness, alpha: 1).getRed(&r, green: &g, blue: &b, alpha: &a)
        func linear(_ c: CGFloat) -> CGFloat { c <= 0.03928 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4) }
        return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
    }

    /// Page colour in light mode: a warm off-white instead of the grey-lilac system background.
    static let warmPaper = Color(red: 0.969, green: 0.957, blue: 0.945)
}

extension Course {
    var tint: Color { Color(hex: color) }
    var glow: Color { Color.glow(color) }
    /// Strong pigment on light surfaces, bright pigment on dark ones (bars, lines, rings).
    func pigment(_ scheme: ColorScheme) -> Color { scheme == .dark ? glow : tint }
}

extension Subject {
    var tint: Color { Color(hex: color) }
    var glow: Color { Color.glow(color) }
    func pigment(_ scheme: ColorScheme) -> Color { scheme == .dark ? glow : tint }
}

/// Lernwerk is dark unless the learner picks light or the system setting.
enum Appearance: String, CaseIterable, Identifiable {
    case dark, light, system

    var id: String { rawValue }

    var label: String {
        switch self {
        case .dark: return "Dunkel"
        case .light: return "Hell"
        case .system: return "Wie das System"
        }
    }

    var scheme: ColorScheme? {
        switch self {
        case .dark: return .dark
        case .light: return .light
        case .system: return nil
        }
    }
}

/// A subject folder: the subject's symbol on a plate with two sheets behind it, like a stack of courses.
struct SubjectBadge: View {
    var subject: Subject
    var size: CGFloat = 48

    var body: some View {
        let r = size * 0.28
        ZStack {
            RoundedRectangle(cornerRadius: r, style: .continuous)
                .fill(subject.tint.opacity(0.28))
                .frame(width: size * 0.84, height: size * 0.84)
                .offset(x: size * 0.12, y: -size * 0.12)
            RoundedRectangle(cornerRadius: r, style: .continuous)
                .fill(subject.tint.opacity(0.5))
                .frame(width: size * 0.9, height: size * 0.9)
                .offset(x: size * 0.06, y: -size * 0.06)
            RoundedRectangle(cornerRadius: r, style: .continuous)
                .fill(LinearGradient(colors: [subject.tint, subject.tint.opacity(0.75)], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: size * 0.9, height: size * 0.9)
                .overlay {
                    Image(systemName: subject.symbol)
                        .font(.system(size: size * 0.4, weight: .semibold))
                        .foregroundStyle(.white)
                }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// Surface of every card: Liquid Glass over the plain page.
struct CardSurface: ViewModifier {
    var padding: CGFloat = 16
    var radius: CGFloat = 26

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .glassEffect(.regular, in: .rect(cornerRadius: radius, style: .continuous))
    }
}

extension View {
    func card(padding: CGFloat = 16, radius: CGFloat = 26) -> some View { modifier(CardSurface(padding: padding, radius: radius)) }

    /// Keeps pages readable on the iPad: one centred column instead of full width.
    func readableColumn(_ maxWidth: CGFloat = 760) -> some View {
        frame(maxWidth: maxWidth).frame(maxWidth: .infinity)
    }

    /// Comes up once when the page first appears, a moment after the elements above it.
    func appearOnce(_ index: Int = 0) -> some View { modifier(AppearOnce(index: index)) }

    /// Marks the view a push zooms out of (iOS zoom transition); the destination uses the same id.
    func zoomSource(_ id: String) -> some View { modifier(ZoomSource(id: id)) }
}

/// Motion is off when iOS or Lernwerk's own setting asks for less of it.
struct MotionSettings {
    static func reduced(system: Bool) -> Bool { system || UserDefaults.standard.bool(forKey: "reduceMotion") }
}

/// Entrance, once per page: fade in and rise a little, staggered by index. Nothing keeps moving afterwards.
struct AppearOnce: ViewModifier {
    var index: Int
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var systemReduce

    func body(content: Content) -> some View {
        let still = MotionSettings.reduced(system: systemReduce)
        content
            .opacity(shown || still ? 1 : 0)
            .offset(y: shown || still ? 0 : 14)
            .onAppear {
                guard !shown else { return }
                withAnimation(.spring(duration: 0.5, bounce: 0.12).delay(Double(min(index, 8)) * 0.045)) { shown = true }
            }
    }
}

private struct ZoomNamespaceKey: EnvironmentKey {
    static let defaultValue: Namespace.ID? = nil
}

extension EnvironmentValues {
    /// Namespace of the home stack's zoom transitions (subjects and courses).
    var zoomNamespace: Namespace.ID? {
        get { self[ZoomNamespaceKey.self] }
        set { self[ZoomNamespaceKey.self] = newValue }
    }
}

struct ZoomSource: ViewModifier {
    var id: String
    @Environment(\.zoomNamespace) private var namespace

    @ViewBuilder
    func body(content: Content) -> some View {
        if let namespace {
            content.matchedTransitionSource(id: id, in: namespace)
        } else {
            content
        }
    }
}

/// Slight press-down for custom tappable tiles.
struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.snappy(duration: 0.18), value: configuration.isPressed)
    }
}

/// A rounded square with the course colour and its SF Symbol.
struct CourseBadge: View {
    var course: Course
    var size: CGFloat = 46

    var body: some View {
        RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
            .fill(LinearGradient(colors: [course.tint, course.tint.opacity(0.72)], startPoint: .topLeading, endPoint: .bottomTrailing))
            .frame(width: size, height: size)
            .overlay {
                Image(systemName: course.symbol)
                    .font(.system(size: size * 0.44, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .accessibilityHidden(true)
    }
}

/// Page background: black in dark mode, warm off-white in light mode, with a faint glow of the page's colour at
/// the top. Kept quiet so the glass on top stays legible (HIG: Liquid Glass color).
struct TintBackground: View {
    var tints: [Color]
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let tint = tints.first ?? .accentColor
        ZStack {
            scheme == .dark ? Color.black : Color.warmPaper
            RadialGradient(colors: [tint.opacity(scheme == .dark ? 0.24 : 0.12), .clear],
                           center: .top, startRadius: 0, endRadius: 420)
                .scaleEffect(x: 1.8, y: 1, anchor: .top)
        }
        .ignoresSafeArea()
    }
}

struct SectionTitle: View {
    var title: String
    var trailing: String? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title).font(.title3.bold())
            Spacer()
            if let trailing {
                Text(trailing).font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding(.top, 6)
    }
}

/// Thin progress bar in the course colour.
struct ProgressLine: View {
    var value: Double
    var tint: Color
    var height: CGFloat = 6
    /// Grows from zero the first time it appears, then follows changes with a spring.
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var systemReduce

    var body: some View {
        let still = MotionSettings.reduced(system: systemReduce)
        let v = shown || still ? min(1, max(0, value)) : 0
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.primary.opacity(0.08))
                Capsule().fill(tint).frame(width: max(height, geo.size.width * v))
            }
        }
        .frame(height: height)
        .animation(still ? nil : .spring(duration: 0.8, bounce: 0.1), value: v)
        .onAppear { shown = true }
        .accessibilityElement()
        .accessibilityValue(Text("\(Int((value * 100).rounded())) Prozent"))
    }
}

/// Ring for the daily goal.
struct GoalRing: View {
    var value: Double
    var tint: Color = .accentColor
    var lineWidth: CGFloat = 7
    /// Draws itself from zero the first time it appears.
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var systemReduce

    var body: some View {
        let still = MotionSettings.reduced(system: systemReduce)
        let v = shown || still ? min(1, max(0.001, value)) : 0.001
        ZStack {
            Circle().stroke(Color.primary.opacity(0.1), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: v)
                .stroke(tint, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
        .animation(still ? nil : .spring(duration: 0.9, bounce: 0.08), value: v)
        .onAppear { shown = true }
    }
}

/// The four training levels. Their colours run like a heat scale: green, amber, red, purple.
struct Level: Identifiable, Hashable {
    let value: Int
    init(_ value: Int) { self.value = max(1, min(4, value)) }
    var id: Int { value }
    static let all: [Level] = (1...4).map { Level($0) }

    var name: String { ["Leicht", "Mittel", "Schwer", "Experte"][value - 1] }

    var blurb: String {
        [
            "Grundaufgaben mit freundlichen Zahlen, ein Schritt.",
            "Zwei, drei Schritte und weniger glatte Werte.",
            "Umgekehrt gefragt, mehrere Ideen verbunden.",
            "Transfer, Begründen, Fallen erkennen.",
        ][value - 1]
    }

    var colors: [Color] {
        switch value {
        case 1: return [Color(hex: "#26A65B"), Color(hex: "#1E9E8F")]
        case 2: return [Color(hex: "#E8930C"), Color(hex: "#E0661B")]
        case 3: return [Color(hex: "#E5484D"), Color(hex: "#C2255C")]
        default: return [Color(hex: "#8E4EC6"), Color(hex: "#5B5BD6")]
        }
    }

    var gradient: LinearGradient { LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing) }

    /// The whole scale from Leicht to Experte.
    static var scale: LinearGradient {
        LinearGradient(colors: [Color(hex: "#26A65B"), Color(hex: "#E8930C"), Color(hex: "#E5484D"), Color(hex: "#5B5BD6")],
                       startPoint: .leading, endPoint: .trailing)
    }
}

/// Four rising bars; the first `filled` take the colours of their level.
struct LevelBars: View {
    var filled: Int
    var height: CGFloat = 14

    var body: some View {
        HStack(alignment: .bottom, spacing: 2) {
            ForEach(Level.all) { lv in
                RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                    .fill(lv.value <= filled ? AnyShapeStyle(lv.gradient) : AnyShapeStyle(Color.primary.opacity(0.14)))
                    .frame(width: height * 0.26, height: height * (0.4 + 0.2 * CGFloat(lv.value)))
            }
        }
        .frame(height: height * 1.2, alignment: .bottom)
        .accessibilityHidden(true)
    }
}

/// Capsule with the level's gradient, its bars and its name.
struct LevelBadge: View {
    var level: Level

    var body: some View {
        HStack(spacing: 6) {
            HStack(alignment: .bottom, spacing: 2) {
                ForEach(Level.all) { lv in
                    RoundedRectangle(cornerRadius: 1, style: .continuous)
                        .fill(Color.white.opacity(lv.value <= level.value ? 1 : 0.38))
                        .frame(width: 3, height: 4 + 2 * CGFloat(lv.value))
                }
            }
            Text(level.name).font(.subheadline.weight(.bold))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 12)
        .padding(.vertical, 5)
        .background(level.gradient, in: .capsule)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Schwierigkeit \(level.name)")
    }
}

enum Format {
    static func relative(_ date: Date?) -> String {
        guard let date else { return "noch nie" }
        if abs(date.timeIntervalSinceNow) < 60 { return "gerade eben" }
        return date.formatted(.relative(presentation: .named).locale(germanLocale))
    }

    static func minutes(_ m: Int?) -> String {
        guard let m else { return "" }
        return "\(m) Min."
    }
}
