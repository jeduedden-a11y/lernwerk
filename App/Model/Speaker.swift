import AVFoundation
import Combine

/// Reads the current step aloud. The lesson runtime supplies the text, formulas in words. Unless a voice was chosen
/// in the settings, the most natural German voice on the device is used (Premium before Erweitert before Standard),
/// and the text is spoken sentence by sentence with short pauses, which sounds less mechanical.
@MainActor
final class Speaker: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published private(set) var isSpeaking = false
    private let synthesizer = AVSpeechSynthesizer()
    private var pending = 0

    /// UserDefaults key of the chosen voice; empty means the best installed German voice.
    nonisolated static let voiceKey = "speechVoice"

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    /// German voices on this device, most natural first. Novelty and personal voices are left out.
    static func germanVoices() -> [AVSpeechSynthesisVoice] {
        AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.hasPrefix("de") }
            .filter { !$0.voiceTraits.contains(.isNoveltyVoice) && !$0.voiceTraits.contains(.isPersonalVoice) }
            .sorted { a, b in
                if a.quality != b.quality { return a.quality.rawValue > b.quality.rawValue }
                if (a.language == "de-DE") != (b.language == "de-DE") { return a.language == "de-DE" }
                return a.name < b.name
            }
    }

    static func voice(for identifier: String) -> AVSpeechSynthesisVoice? {
        if !identifier.isEmpty, let chosen = AVSpeechSynthesisVoice(identifier: identifier) { return chosen }
        return germanVoices().first ?? AVSpeechSynthesisVoice(language: "de-DE")
    }

    static func qualityLabel(_ voice: AVSpeechSynthesisVoice) -> String {
        switch voice.quality {
        case .premium: return "Premium"
        case .enhanced: return "Erweitert"
        default: return "Standard"
        }
    }

    /// Splits at sentence ends, so every sentence gets its own melody and a short pause before the next one.
    static func sentences(_ text: String) -> [String] {
        let clean = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else { return [] }
        var parts: [String] = []
        clean.enumerateSubstrings(in: clean.startIndex..., options: [.bySentences, .localized]) { sub, _, _, _ in
            if let s = sub?.trimmingCharacters(in: .whitespacesAndNewlines), !s.isEmpty { parts.append(s) }
        }
        return parts.isEmpty ? [clean] : parts
    }

    func speak(_ text: String) {
        stop()
        let parts = Self.sentences(text)
        guard !parts.isEmpty else { return }
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        try? session.setActive(true)
        let voice = Self.voice(for: UserDefaults.standard.string(forKey: Self.voiceKey) ?? "")
        // the better voices sound best close to their natural pace, the compact one a little slower
        let rate = AVSpeechUtteranceDefaultSpeechRate * ((voice?.quality ?? .default) == .default ? 0.94 : 0.98)
        pending = parts.count
        for (i, part) in parts.enumerated() {
            let utterance = AVSpeechUtterance(string: part)
            utterance.voice = voice
            utterance.rate = rate
            utterance.postUtteranceDelay = i == parts.count - 1 ? 0 : 0.14
            synthesizer.speak(utterance)
        }
        isSpeaking = true
    }

    func stop() {
        pending = 0
        if synthesizer.isSpeaking { synthesizer.stopSpeaking(at: .immediate) }
        isSpeaking = false
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in self.ended() }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in self.ended() }
    }

    /// One utterance is over; when the last one is, the audio session is handed back.
    private func ended() {
        if pending > 0 { pending -= 1 }
        guard pending == 0, !synthesizer.isSpeaking else { return }
        isSpeaking = false
        try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }
}
