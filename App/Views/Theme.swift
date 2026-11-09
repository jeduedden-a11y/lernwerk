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

extension Course {
    var tint: Color { Color(hex: color) }
}

extension Subject {
    var tint: Color { Color(hex: color) }
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

/// Content-layer surface: standard material, never Liquid Glass (HIG: glass is for controls and navigation).
struct CardSurface: ViewModifier {
    var padding: CGFloat = 16
    var radius: CGFloat = 26
    @Environment(\.colorScheme) private var scheme

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.regularMaterial, in: .rect(cornerRadius: radius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(Color.primary.opacity(scheme == .dark ? 0.10 : 0.05), lineWidth: 0.5)
            }
    }
}

extension View {
    func card(padding: CGFloat = 16, radius: CGFloat = 26) -> some View { modifier(CardSurface(padding: padding, radius: radius)) }

    /// Keeps pages readable on the iPad: one centred column instead of full width.
    func readableColumn(_ maxWidth: CGFloat = 760) -> some View {
        frame(maxWidth: maxWidth).frame(maxWidth: .infinity)
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

/// Quiet colour wash behind a page, built from one or more tints.
struct TintBackground: View {
    var tints: [Color]
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        // Kept light so the monochrome glass bars stay legible over it (HIG: Liquid Glass color).
        let strong = scheme == .dark ? 0.32 : 0.18
        let soft = scheme == .dark ? 0.16 : 0.09
        let a = tints.first ?? .accentColor
        let b = tints.count > 1 ? tints[1] : a
        let c = tints.count > 2 ? tints[2] : b
        ZStack {
            Color(uiColor: .systemGroupedBackground)
            MeshGradient(
                width: 3, height: 3,
                points: [
                    [0, 0], [0.5, 0], [1, 0],
                    [0, 0.38], [0.6, 0.32], [1, 0.44],
                    [0, 1], [0.5, 1], [1, 1],
                ],
                colors: [
                    a.opacity(strong), b.opacity(soft), c.opacity(strong * 0.8),
                    a.opacity(soft * 0.6), .clear, c.opacity(soft * 0.6),
                    .clear, .clear, .clear,
                ]
            )
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

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Color.primary.opacity(0.08))
                Capsule().fill(tint).frame(width: max(6, geo.size.width * min(1, max(0, value))))
            }
        }
        .frame(height: 6)
        .accessibilityElement()
        .accessibilityValue(Text("\(Int((value * 100).rounded())) Prozent"))
    }
}

/// Ring for the daily goal.
struct GoalRing: View {
    var value: Double
    var tint: Color = .accentColor
    var lineWidth: CGFloat = 7

    var body: some View {
        ZStack {
            Circle().stroke(Color.primary.opacity(0.1), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: min(1, max(0.001, value)))
                .stroke(tint, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
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
