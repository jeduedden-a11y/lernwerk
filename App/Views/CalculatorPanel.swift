import SwiftUI
import LernwerkCore

/// One calculation of the history.
struct CalcEntry: Identifiable, Equatable {
    let id = UUID()
    let expression: String
    let value: Double
}

/// What the calculator keeps while a lesson is open: the input, the history, the second layer of keys.
@Observable final class CalculatorState {
    var input = ""
    var history: [CalcEntry] = []
    var second = false
    var error: String?
    /// The input shows a result: a digit starts anew, an operator goes on with the result.
    var showsResult = false
}

/// A scientific calculator beside the task: on the iPhone a panel above the buttons, on the iPad the column beside
/// the lesson. "Einsetzen" puts the result into the answer field of the current step.
struct CalculatorPanel: View {
    let state: CalculatorState
    var accent: Color
    var compact: Bool
    var onInsert: ((String) -> Void)?
    var onClose: () -> Void

    @AppStorage("calcAngle") private var angleRaw = CalcEngine.Angle.deg.rawValue
    @AppStorage("calcAns") private var ans: Double = 0

    private var angle: CalcEngine.Angle { CalcEngine.Angle(rawValue: angleRaw) ?? .deg }
    private var engine: CalcEngine { CalcEngine(angle: angle, ans: ans) }
    private var keyHeight: CGFloat { compact ? 34 : 48 }

    /// The value the input stands for right now, nil while it cannot be evaluated.
    private var current: Double? {
        if state.showsResult { return state.history.first?.value }
        guard !state.input.isEmpty else { return nil }
        return try? engine.evaluate(state.input)
    }

    var body: some View {
        VStack(spacing: compact ? 6 : 10) {
            header
            display
            keys
        }
        .padding(.horizontal, 12)
        .padding(.top, 10)
        .padding(.bottom, 12)
    }

    // MARK: header and display

    private var header: some View {
        HStack(spacing: 8) {
            Text("Rechner")
                .font(.headline)
                .lineLimit(1)
            Spacer(minLength: 4)
            Menu {
                ForEach(state.history) { entry in
                    Button {
                        insertValue(entry.value)
                    } label: {
                        Text(CalcEngine.format(entry.value))
                        Text(entry.expression)
                    }
                }
            } label: {
                Image(systemName: "clock.arrow.circlepath")
                    .font(.body.weight(.semibold))
                    .frame(width: 30, height: 30)
            }
            .disabled(state.history.isEmpty)
            .accessibilityLabel("Verlauf")
            if let onInsert {
                Button("Einsetzen") {
                    if let v = current { onInsert(CalcEngine.answerText(v)) }
                }
                .buttonStyle(.glassProminent)
                .disabled(current == nil)
                .accessibilityHint("Setzt das Ergebnis in das Antwortfeld der Aufgabe")
            }
            Button {
                onClose()
            } label: {
                Image(systemName: "xmark")
                    .font(.body.weight(.semibold))
                    .frame(width: 22, height: 22)
            }
            .buttonStyle(.glass)
            .buttonBorderShape(.circle)
            .accessibilityLabel("Rechner schließen")
        }
    }

    private var display: some View {
        VStack(alignment: .trailing, spacing: 2) {
            HStack(spacing: 6) {
                Text(angle == .deg ? "DEG" : "RAD")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
                if state.second {
                    Text("2nd")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(accent)
                }
                Spacer(minLength: 4)
                if state.showsResult, let last = state.history.first {
                    Text(last.expression + " =")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .truncationMode(.head)
                }
            }
            Text(state.input.isEmpty ? "0" : state.input)
                .font(.system(size: compact ? 24 : 30, weight: .medium, design: .rounded))
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.45)
                .truncationMode(.head)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .accessibilityLabel("Eingabe")
                .accessibilityValue(state.input.isEmpty ? "leer" : state.input)
            Text(resultLine)
                .font(.callout.weight(.semibold))
                .monospacedDigit()
                .foregroundStyle(state.error == nil ? Color.secondary : Color.red)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color(uiColor: .tertiarySystemFill), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var resultLine: String {
        if let error = state.error { return error }
        if !state.showsResult, let v = current { return "= " + CalcEngine.format(v) }
        if state.showsResult, let v = current { return CalcEngine.format(v) }
        return " "
    }

    // MARK: keys

    private var keys: some View {
        let s = state.second
        return Grid(horizontalSpacing: 5, verticalSpacing: 5) {
            GridRow {
                actionKey("2nd", role: s ? .accent : .fn, label: "Zweitbelegung") { state.second.toggle() }
                actionKey(angle == .deg ? "DEG" : "RAD", role: .fn, label: angle == .deg ? "Grad, umschalten auf Bogenmaß" : "Bogenmaß, umschalten auf Grad") {
                    angleRaw = angle == .deg ? CalcEngine.Angle.rad.rawValue : CalcEngine.Angle.deg.rawValue
                }
                constantsKey
                actionKey("AC", role: .op, label: "Alles löschen") { clear() }
                actionKey("⌫", role: .op, label: "Löschen") { backspace() }
                key("(", role: .op)
                key(")", role: .op)
            }
            GridRow {
                key(s ? "sin⁻¹" : "sin", insert: s ? "sin⁻¹(" : "sin(")
                key(s ? "cos⁻¹" : "cos", insert: s ? "cos⁻¹(" : "cos(")
                key(s ? "tan⁻¹" : "tan", insert: s ? "tan⁻¹(" : "tan(")
                key("7", role: .digit)
                key("8", role: .digit)
                key("9", role: .digit)
                key("÷", role: .op, label: "geteilt durch")
            }
            GridRow {
                key(s ? "log₂" : "ln", insert: s ? "log₂(" : "ln(")
                key(s ? "10ˣ" : "log", insert: s ? "10^(" : "log(", label: s ? "zehn hoch" : "Zehnerlogarithmus")
                key(s ? "|x|" : "eˣ", insert: s ? "abs(" : "e^(", label: s ? "Betrag" : "e hoch")
                key("4", role: .digit)
                key("5", role: .digit)
                key("6", role: .digit)
                key("×", role: .op, label: "mal")
            }
            GridRow {
                key(s ? "x³" : "x²", insert: s ? "³" : "²", label: s ? "hoch drei" : "Quadrat")
                key(s ? "ʸ√x" : "xʸ", insert: s ? "ʸ√" : "^", label: s ? "y-te Wurzel" : "hoch")
                key(s ? "∛" : "√", insert: s ? "∛(" : "√(", label: s ? "Kubikwurzel" : "Wurzel")
                key("1", role: .digit)
                key("2", role: .digit)
                key("3", role: .digit)
                key("−", role: .op, insert: "−", label: "minus")
            }
            GridRow {
                key("π", label: "pi")
                key("e", label: "eulersche Zahl")
                key("x⁻¹", insert: "⁻¹", label: "Kehrwert")
                key("0", role: .digit)
                key(",", role: .digit, label: "Komma")
                key("ᴇ", role: .digit, label: "mal zehn hoch")
                key("+", role: .op, label: "plus")
            }
            GridRow {
                key("n!", insert: "!", label: "Fakultät")
                key(s ? "nPr" : "nCr", insert: s ? " nPr " : " nCr ", label: s ? "Variationen" : "Binomialkoeffizient")
                key("%", label: "Prozent")
                key("(−)", role: .digit, insert: "−", label: "negativ")
                key("Ans", role: .digit, label: "letztes Ergebnis")
                actionKey("=", role: .accent, label: "Ergebnis") { evaluate() }
                    .gridCellColumns(2)
            }
        }
    }

    private enum Role { case digit, op, fn, accent }

    private func key(_ title: String, role: Role = .fn, insert: String? = nil, label: String? = nil) -> some View {
        actionKey(title, role: role, label: label ?? title) { self.insert(insert ?? title) }
    }

    private func actionKey(_ title: String, role: Role, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(role == .digit || role == .accent ? .system(size: compact ? 19 : 22, weight: .medium, design: .rounded) : .system(size: compact ? 15 : 17, weight: .medium))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .frame(maxWidth: .infinity, minHeight: keyHeight, maxHeight: keyHeight)
        }
        .buttonStyle(CalcKeyStyle(fill: fill(role), ink: role == .accent ? .white : role == .op ? accent : .primary))
        .accessibilityLabel(label)
    }

    private var constantsKey: some View {
        Menu {
            ForEach(CalcEngine.constants) { c in
                Button {
                    insert(c.symbol)
                } label: {
                    Text("\(c.symbol)   \(c.name)")
                    Text(CalcEngine.format(c.value) + " " + c.unit)
                }
            }
        } label: {
            Text("Konst")
                .font(.system(size: compact ? 15 : 17, weight: .medium))
                .lineLimit(1)
                .minimumScaleFactor(0.6)
                .foregroundStyle(Color.primary)
                .frame(maxWidth: .infinity, minHeight: keyHeight, maxHeight: keyHeight)
                .background(fill(.fn), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .accessibilityLabel("Konstanten")
    }

    private func fill(_ role: Role) -> Color {
        switch role {
        case .digit: return Color(uiColor: .secondarySystemFill)
        case .op: return accent.opacity(0.16)
        case .fn: return Color(uiColor: .tertiarySystemFill)
        case .accent: return accent
        }
    }

    // MARK: editing

    /// Operators continue a shown result; anything else starts a new input.
    private static let continuing: Set<String> = ["÷", "×", "−", "+", "^", "²", "³", "⁻¹", "!", "%", " nCr ", " nPr ", "ʸ√"]

    /// Pieces the delete key removes at once.
    private static let chunks: [String] = (["sin⁻¹(", "cos⁻¹(", "tan⁻¹(", "sin(", "cos(", "tan(", "log₂(", "log(", "ln(", "abs(", "10^(", "e^(",
                                            "√(", "∛(", " nCr ", " nPr ", "ʸ√", "⁻¹", "Ans"]
                                           + CalcEngine.constants.map(\.symbol).filter { $0.count > 1 })
        .sorted { $0.count > $1.count }

    private func insert(_ text: String) {
        state.error = nil
        if state.showsResult {
            state.showsResult = false
            if !Self.continuing.contains(text) { state.input = "" }
        }
        state.input += text
        state.second = false
    }

    private func insertValue(_ value: Double) {
        insert(CalcEngine.inputText(value))
    }

    private func backspace() {
        state.error = nil
        if state.showsResult {
            state.showsResult = false
            state.input = ""
            return
        }
        for chunk in Self.chunks where state.input.hasSuffix(chunk) {
            state.input.removeLast(chunk.count)
            return
        }
        if !state.input.isEmpty { state.input.removeLast() }
    }

    private func clear() {
        state.input = ""
        state.error = nil
        state.showsResult = false
        state.second = false
    }

    private func evaluate() {
        guard !state.input.isEmpty, !state.showsResult else { return }
        do {
            let v = try engine.evaluate(state.input)
            state.history.insert(CalcEntry(expression: state.input, value: v), at: 0)
            if state.history.count > 15 { state.history.removeLast() }
            ans = v
            state.input = CalcEngine.inputText(v)
            state.showsResult = true
            state.error = nil
        } catch let failure as CalcEngine.Failure {
            state.error = failure.message
        } catch {
            state.error = "Nicht berechenbar"
        }
    }
}

/// Flat keys that darken while pressed.
private struct CalcKeyStyle: ButtonStyle {
    var fill: Color
    var ink: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(ink)
            .background(fill, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .opacity(configuration.isPressed ? 0.55 : 1)
            .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}
