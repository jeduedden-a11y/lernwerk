import Foundation

/// A constant of the calculator: the symbol as typed, its name, the value in SI units and the unit.
public struct CalcConstant: Sendable, Hashable, Identifiable {
    public let symbol: String
    public let name: String
    public let value: Double
    public let unit: String
    public var id: String { symbol }
}

/// The engine of the calculator. Reads an expression as typed on the keys and evaluates it: decimal comma or point,
/// + − × ÷ and ^, roots, factorial, percent, trigonometry in degrees or radians, logarithms, nCr and nPr, constants of
/// physics and chemistry and the previous answer. The multiplication sign may be left out before a bracket, a constant
/// or a function (2π, 3(4 + 5), 2sin(30), 13,6eV), and brackets still open at the end close by themselves.
public struct CalcEngine: Sendable {
    public enum Angle: String, Sendable, Codable, CaseIterable { case deg, rad }

    public struct Failure: Error, Equatable, Sendable {
        public let message: String
        public init(_ message: String) { self.message = message }
    }

    public var angle: Angle
    /// The previous result, typed as "Ans".
    public var ans: Double

    public init(angle: Angle = .deg, ans: Double = 0) {
        self.angle = angle
        self.ans = ans
    }

    /// CODATA 2018 values; g is the value used at school.
    public static let constants: [CalcConstant] = [
        CalcConstant(symbol: "c", name: "Lichtgeschwindigkeit", value: 299_792_458, unit: "m/s"),
        CalcConstant(symbol: "g", name: "Fallbeschleunigung (Ortsfaktor)", value: 9.81, unit: "m/s²"),
        CalcConstant(symbol: "G", name: "Gravitationskonstante", value: 6.674_30e-11, unit: "m³/(kg·s²)"),
        CalcConstant(symbol: "h", name: "Planck-Konstante", value: 6.626_070_15e-34, unit: "J·s"),
        CalcConstant(symbol: "ħ", name: "reduzierte Planck-Konstante", value: 1.054_571_817e-34, unit: "J·s"),
        CalcConstant(symbol: "qₑ", name: "Elementarladung", value: 1.602_176_634e-19, unit: "C"),
        CalcConstant(symbol: "eV", name: "Elektronenvolt", value: 1.602_176_634e-19, unit: "J"),
        CalcConstant(symbol: "mₑ", name: "Elektronenmasse", value: 9.109_383_701_5e-31, unit: "kg"),
        CalcConstant(symbol: "mₚ", name: "Protonenmasse", value: 1.672_621_923_69e-27, unit: "kg"),
        CalcConstant(symbol: "mₙ", name: "Neutronenmasse", value: 1.674_927_498_04e-27, unit: "kg"),
        CalcConstant(symbol: "u", name: "atomare Masseneinheit", value: 1.660_539_066_60e-27, unit: "kg"),
        CalcConstant(symbol: "ε₀", name: "elektrische Feldkonstante", value: 8.854_187_812_8e-12, unit: "A·s/(V·m)"),
        CalcConstant(symbol: "μ₀", name: "magnetische Feldkonstante", value: 1.256_637_062_12e-6, unit: "V·s/(A·m)"),
        CalcConstant(symbol: "kʙ", name: "Boltzmann-Konstante", value: 1.380_649e-23, unit: "J/K"),
        CalcConstant(symbol: "Nᴀ", name: "Avogadro-Konstante", value: 6.022_140_76e23, unit: "1/mol"),
        CalcConstant(symbol: "R", name: "universelle Gaskonstante", value: 8.314_462_618, unit: "J/(mol·K)"),
        CalcConstant(symbol: "F", name: "Faraday-Konstante", value: 96_485.332_12, unit: "C/mol"),
        CalcConstant(symbol: "Vₘ", name: "molares Volumen (0 °C, 1013 hPa)", value: 22.413_969_54e-3, unit: "m³/mol"),
        CalcConstant(symbol: "R∞", name: "Rydberg-Konstante", value: 10_973_731.568_160, unit: "1/m"),
        CalcConstant(symbol: "σ", name: "Stefan-Boltzmann-Konstante", value: 5.670_374_419e-8, unit: "W/(m²·K⁴)"),
    ]

    // ------------------------------------------------------------------ tokens

    enum Token: Equatable {
        case number(Double)
        case value(Double) // constant or Ans
        case op(String) // + − × ÷ ^ nCr nPr ʸ√
        case postfix(String) // ! % ² ³ ⁻¹
        case function(String)
        case open, close
    }

    static let functions = ["sin⁻¹", "cos⁻¹", "tan⁻¹", "sinh", "cosh", "tanh", "sin", "cos", "tan", "ln", "log₂", "log", "abs", "exp", "√", "∛"]
    static let infix = ["nCr", "nPr", "ʸ√"]

    func tokenize(_ text: String) throws -> [Token] {
        var names: [(String, Token)] = Self.functions.map { ($0, Token.function($0)) }
        names += Self.infix.map { ($0, Token.op($0)) }
        names.append(("Ans", Token.value(ans)))
        names.append(("π", Token.value(Double.pi)))
        names.append(("e", Token.value(M_E)))
        names += Self.constants.map { ($0.symbol, Token.value($0.value)) }
        names.sort { $0.0.count > $1.0.count }
        let chars = Array(text)
        var tokens: [Token] = []
        var i = 0
        while i < chars.count {
            let ch = chars[i]
            if ch == " " || ch == "\u{2009}" || ch == "\u{00A0}" { i += 1; continue }
            if ch.isNumber && ch.isASCII || ch == "," || ch == "." {
                var digits = ""
                var seenSeparator = false
                while i < chars.count, (chars[i].isASCII && chars[i].isNumber) || ((chars[i] == "," || chars[i] == ".") && !seenSeparator) {
                    if chars[i] == "," || chars[i] == "." { seenSeparator = true; digits.append(".") } else { digits.append(chars[i]) }
                    i += 1
                }
                if digits == "." { throw Failure("Komma ohne Zahl") }
                if i < chars.count, chars[i] == "ᴇ" {
                    i += 1
                    var exp = ""
                    if i < chars.count, "−-+".contains(chars[i]) { exp.append(chars[i] == "+" ? "+" : "-"); i += 1 }
                    let start = exp.count
                    while i < chars.count, chars[i].isASCII, chars[i].isNumber { exp.append(chars[i]); i += 1 }
                    if exp.count == start { throw Failure("Nach ᴇ fehlt der Exponent") }
                    digits += "e" + exp
                }
                guard let v = Double(digits) else { throw Failure("Zahl nicht lesbar") }
                tokens.append(.number(v))
                continue
            }
            switch ch {
            case "+": tokens.append(.op("+")); i += 1; continue
            case "-", "−": tokens.append(.op("−")); i += 1; continue
            case "×", "*", "·": tokens.append(.op("×")); i += 1; continue
            case "÷", "/", ":": tokens.append(.op("÷")); i += 1; continue
            case "^": tokens.append(.op("^")); i += 1; continue
            case "(": tokens.append(.open); i += 1; continue
            case ")": tokens.append(.close); i += 1; continue
            case "!", "%", "²", "³": tokens.append(.postfix(String(ch))); i += 1; continue
            default: break
            }
            if ch == "⁻", i + 1 < chars.count, chars[i + 1] == "¹" {
                tokens.append(.postfix("⁻¹"))
                i += 2
                continue
            }
            var matched = false
            for (name, token) in names {
                let n = Array(name)
                if i + n.count <= chars.count, Array(chars[i..<(i + n.count)]) == n {
                    tokens.append(token)
                    i += n.count
                    matched = true
                    break
                }
            }
            if !matched { throw Failure("Unbekanntes Zeichen „\(ch)“") }
        }
        return tokens
    }

    // ------------------------------------------------------------------ parser

    struct Parser {
        let tokens: [Token]
        let engine: CalcEngine
        var i = 0

        var atEnd: Bool { i >= tokens.count }

        mutating func expression() throws -> Double {
            var v = try term()
            while !atEnd, case .op(let o) = tokens[i], o == "+" || o == "−" {
                i += 1
                let r = try term()
                v = o == "+" ? v + r : v - r
            }
            return v
        }

        mutating func term() throws -> Double {
            var v = try unary()
            while !atEnd {
                switch tokens[i] {
                case .op(let o) where o == "×" || o == "÷" || CalcEngine.infix.contains(o):
                    i += 1
                    let r = try unary()
                    v = try engine.binary(o, v, r)
                case .value, .function, .open:
                    // multiplication without a sign: 2π, 3(4 + 5), 2sin(30)
                    let r = try power()
                    v *= r
                default:
                    return v
                }
            }
            return v
        }

        mutating func unary() throws -> Double {
            if !atEnd, case .op(let o) = tokens[i], o == "−" || o == "+" {
                i += 1
                let v = try unary()
                return o == "−" ? -v : v
            }
            return try power()
        }

        mutating func power() throws -> Double {
            let base = try postfix()
            if !atEnd, case .op("^") = tokens[i] {
                i += 1
                let exponent = try unary()
                return try engine.power(base, exponent)
            }
            return base
        }

        mutating func postfix() throws -> Double {
            var v = try primary()
            while !atEnd, case .postfix(let p) = tokens[i] {
                i += 1
                v = try engine.postfix(p, v)
            }
            return v
        }

        mutating func primary() throws -> Double {
            guard !atEnd else { throw Failure("Ausdruck unvollständig") }
            let t = tokens[i]
            i += 1
            switch t {
            case .number(let x), .value(let x):
                return x
            case .open:
                return try bracket()
            case .function(let f):
                let x: Double
                if !atEnd, case .open = tokens[i] {
                    i += 1
                    x = try bracket()
                } else {
                    x = try unary()
                }
                return try engine.function(f, x)
            case .close:
                throw Failure("Klammer zu ohne Klammer auf")
            case .op(let o):
                throw Failure("„\(o)“ an dieser Stelle fehlt eine Zahl davor")
            case .postfix(let p):
                throw Failure("„\(p)“ braucht eine Zahl davor")
            }
        }

        /// The inside of a bracket; a bracket still open at the end closes by itself.
        mutating func bracket() throws -> Double {
            let v = try expression()
            if !atEnd {
                guard case .close = tokens[i] else { throw Failure("Klammer zu fehlt") }
                i += 1
            }
            return v
        }
    }

    // ------------------------------------------------------------------ evaluation

    public func evaluate(_ text: String) throws -> Double {
        let tokens = try tokenize(text)
        guard !tokens.isEmpty else { throw Failure("Leere Eingabe") }
        var parser = Parser(tokens: tokens, engine: self)
        let v = try parser.expression()
        if !parser.atEnd {
            if case .close = tokens[parser.i] { throw Failure("Klammer zu ohne Klammer auf") }
            throw Failure("Zwischen zwei Zahlen fehlt ein Rechenzeichen")
        }
        guard v.isFinite else { throw Failure(v.isNaN ? "Nicht definiert" : "Ergebnis zu groß") }
        return v == 0 ? 0 : v
    }

    private func radians(_ x: Double) -> Double { angle == .deg ? x * .pi / 180 : x }
    private func fromRadians(_ x: Double) -> Double { angle == .deg ? x * 180 / .pi : x }

    /// Sine, cosine and tangent, exact at multiples of 90° and cleaned of rounding noise near zero.
    private func trig(_ f: String, _ x: Double) throws -> Double {
        if angle == .deg, x.truncatingRemainder(dividingBy: 90) == 0, abs(x) < 1e15 {
            let k = Int((x / 90).rounded()) % 4
            let q = (k + 4) % 4
            switch f {
            case "sin": return [0, 1, 0, -1][q]
            case "cos": return [1, 0, -1, 0][q]
            default:
                if q % 2 == 1 { throw Failure("tan ist bei \(Self.format(x))° nicht definiert") }
                return 0
            }
        }
        let r = radians(x)
        let v: Double
        switch f {
        case "sin": v = sin(r)
        case "cos": v = cos(r)
        default:
            if abs(cos(r)) < 1e-15 { throw Failure("tan ist hier nicht definiert") }
            v = tan(r)
        }
        return abs(v) < 1e-14 ? 0 : v
    }

    func function(_ f: String, _ x: Double) throws -> Double {
        switch f {
        case "sin", "cos", "tan":
            return try trig(f, x)
        case "sin⁻¹", "cos⁻¹":
            guard x >= -1 - 1e-12, x <= 1 + 1e-12 else { throw Failure("\(f) gibt es nur für Werte zwischen −1 und 1") }
            let c = min(1, max(-1, x))
            return fromRadians(f == "sin⁻¹" ? asin(c) : acos(c))
        case "tan⁻¹": return fromRadians(atan(x))
        case "sinh": return sinh(x)
        case "cosh": return cosh(x)
        case "tanh": return tanh(x)
        case "ln", "log", "log₂":
            guard x > 0 else { throw Failure("Logarithmen gibt es nur für positive Zahlen") }
            return f == "ln" ? log(x) : f == "log" ? log10(x) : log2(x)
        case "√":
            guard x >= 0 else { throw Failure("Keine Wurzel aus einer negativen Zahl") }
            return x.squareRoot()
        case "∛": return cbrt(x)
        case "abs": return abs(x)
        case "exp": return exp(x)
        default: throw Failure("Unbekannte Funktion \(f)")
        }
    }

    func binary(_ o: String, _ a: Double, _ b: Double) throws -> Double {
        switch o {
        case "×": return a * b
        case "÷":
            if b == 0 { throw Failure("Division durch null") }
            return a / b
        case "nCr", "nPr":
            guard a >= 0, b >= 0, a == a.rounded(), b == b.rounded() else { throw Failure("\(o) braucht natürliche Zahlen") }
            guard b <= a else { return 0 }
            var v = 1.0
            if o == "nPr" {
                for k in stride(from: a - b + 1, through: a, by: 1) { v *= k }
            } else {
                let r = min(b, a - b)
                if r > 0 { for k in 1...Int(r) { v = v * (a - r + Double(k)) / Double(k) } }
                v = v.rounded()
            }
            return v
        case "ʸ√":
            if a == 0 { throw Failure("Die 0-te Wurzel gibt es nicht") }
            if b < 0 {
                guard a == a.rounded(), Int(a) % 2 != 0 else { throw Failure("Gerade Wurzeln aus negativen Zahlen gibt es nicht") }
                return -pow(-b, 1 / a)
            }
            return pow(b, 1 / a)
        default: throw Failure("Unbekanntes Rechenzeichen \(o)")
        }
    }

    func power(_ a: Double, _ b: Double) throws -> Double {
        if a < 0 && b != b.rounded() { throw Failure("Negative Basis nur mit ganzzahligem Exponenten") }
        if a == 0 && b < 0 { throw Failure("Division durch null") }
        return pow(a, b)
    }

    func postfix(_ p: String, _ x: Double) throws -> Double {
        switch p {
        case "!":
            guard x >= 0, x == x.rounded() else { throw Failure("Fakultät nur für natürliche Zahlen") }
            guard x <= 170 else { throw Failure("Ergebnis zu groß") }
            var v = 1.0
            if x >= 2 { for k in 2...Int(x) { v *= Double(k) } }
            return v
        case "%": return x / 100
        case "²": return x * x
        case "³": return x * x * x
        case "⁻¹":
            if x == 0 { throw Failure("Division durch null") }
            return 1 / x
        default: throw Failure("Unbekanntes Zeichen \(p)")
        }
    }

    // ------------------------------------------------------------------ output

    private static let superscripts: [Character: Character] = ["0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻"]

    /// Fixed notation with at most `significant` significant digits, trailing zeros removed, point as separator.
    static func plain(_ x: Double, significant: Int) -> String {
        if x == 0 { return "0" }
        let magnitude = Int(floor(log10(abs(x))))
        let decimals = max(0, min(15, significant - 1 - magnitude))
        var s = String(format: "%.\(decimals)f", x)
        if s.contains(".") {
            while s.hasSuffix("0") { s.removeLast() }
            if s.hasSuffix(".") { s.removeLast() }
        }
        if s == "-0" { s = "0" }
        return s
    }

    /// Mantissa (point as separator) and power of ten for numbers written as m·10ᵏ.
    static func scientific(_ x: Double, significant: Int) -> (String, Int) {
        var e = Int(floor(log10(abs(x))))
        var m = plain(x / pow(10, Double(e)), significant: significant)
        if let mv = Double(m), abs(mv) >= 10 {
            e += 1
            m = plain(x / pow(10, Double(e)), significant: significant)
        }
        return (m, e)
    }

    private static func needsPower(_ x: Double) -> Bool {
        let a = abs(x)
        return x != 0 && (a >= 1e10 || a < 1e-6)
    }

    /// German notation for the display: decimal comma, real minus sign, large and small numbers as m·10ᵏ.
    public static func format(_ x: Double, significant: Int = 10) -> String {
        if x.isNaN { return "–" }
        if needsPower(x) {
            let (m, e) = scientific(x, significant: significant)
            let exp = String(String(e).map { superscripts[$0] ?? $0 })
            return m.replacingOccurrences(of: ".", with: ",").replacingOccurrences(of: "-", with: "−") + "·10" + exp
        }
        return plain(x, significant: significant).replacingOccurrences(of: ".", with: ",").replacingOccurrences(of: "-", with: "−")
    }

    /// The value as the answer fields of the lessons read it: decimal comma, large and small numbers as m*10^k.
    public static func answerText(_ x: Double, significant: Int = 10) -> String {
        if needsPower(x) {
            let (m, e) = scientific(x, significant: significant)
            return m.replacingOccurrences(of: ".", with: ",") + "*10^" + String(e)
        }
        return plain(x, significant: significant).replacingOccurrences(of: ".", with: ",")
    }

    /// The value as the calculator reads it back, for the history.
    public static func inputText(_ x: Double, significant: Int = 12) -> String {
        if needsPower(x) {
            let (m, e) = scientific(x, significant: significant)
            return m.replacingOccurrences(of: ".", with: ",").replacingOccurrences(of: "-", with: "−") + "ᴇ" + String(e).replacingOccurrences(of: "-", with: "−")
        }
        return plain(x, significant: significant).replacingOccurrences(of: ".", with: ",").replacingOccurrences(of: "-", with: "−")
    }
}
