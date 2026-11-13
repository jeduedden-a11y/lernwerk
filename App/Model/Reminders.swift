import Foundation
import UserNotifications
import LernwerkCore

/// Local notifications only, nothing goes over a server: a daily reminder that names the repetitions due at that
/// moment and opens the daily mix, and the number of due repetitions on the app icon.
@MainActor
final class Reminders: NSObject, UNUserNotificationCenterDelegate {
    static let shared = Reminders()

    /// Opens a lernwerk:// link when a reminder is tapped.
    var onOpen: ((URL) -> Void)?

    private let center = UNUserNotificationCenter.current()
    private static let prefix = "lw-reminder-"
    private static let days = 7

    struct Settings {
        var daily: Bool
        var hour: Int
        var minute: Int
        var badge: Bool
    }

    /// The same keys SettingsView writes with @AppStorage.
    static var settings: Settings {
        let d = UserDefaults.standard
        return Settings(daily: d.bool(forKey: "reminderOn"),
                        hour: d.object(forKey: "reminderHour") as? Int ?? 18,
                        minute: d.object(forKey: "reminderMinute") as? Int ?? 0,
                        badge: d.object(forKey: "badgeOn") as? Bool ?? true)
    }

    func activate() { center.delegate = self }

    /// Asks once; afterwards iOS answers from its settings without asking again.
    func requestPermission() async -> Bool {
        (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
    }

    func isAllowed() async -> Bool {
        let status = await center.notificationSettings().authorizationStatus
        return status == .authorized || status == .provisional || status == .ephemeral
    }

    func isDenied() async -> Bool { await center.notificationSettings().authorizationStatus == .denied }

    /// Sets the badge and plans the reminders of the next days, each with the repetitions due at its time. Runs
    /// whenever the app goes to the background, so the numbers follow every finished lesson and review.
    func refresh(state: LearnerState, now: Date = Date()) async {
        let s = Self.settings
        let allowed = await isAllowed()
        if allowed { try? await center.setBadgeCount(s.badge ? state.dueCards(now: now).count : 0) }
        center.removePendingNotificationRequests(withIdentifiers: (0..<Self.days).map { Self.prefix + String($0) })
        guard allowed, s.daily else { return }
        let calendar = Calendar.current
        var planned = 0
        for offset in 0...Self.days {
            guard planned < Self.days,
                  let day = calendar.date(byAdding: .day, value: offset, to: calendar.startOfDay(for: now)),
                  let at = calendar.date(bySettingHour: s.hour, minute: s.minute, second: 0, of: day), at > now else { continue }
            let due = state.dueCards(now: at).count
            let content = UNMutableNotificationContent()
            content.title = due > 0 ? "Zeit für den Tagesmix" : "Ein paar Minuten Lernwerk"
            switch due {
            case 0: content.body = "Heute ist keine Wiederholung fällig. Neue Aufgaben aus deinen Fächern warten im Tagesmix."
            case 1: content.body = "1 Wiederholung ist fällig, dazu neue Aufgaben aus deinen Fächern."
            default: content.body = "\(due) Wiederholungen sind fällig, dazu neue Aufgaben aus deinen Fächern."
            }
            content.sound = .default
            if s.badge { content.badge = NSNumber(value: due) }
            content.userInfo = ["url": "lernwerk://tagesmix"]
            content.threadIdentifier = "tagesmix"
            let parts = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: at)
            let request = UNNotificationRequest(identifier: Self.prefix + String(planned), content: content,
                                                trigger: UNCalendarNotificationTrigger(dateMatching: parts, repeats: false))
            try? await center.add(request)
            planned += 1
        }
    }

    // MARK: UNUserNotificationCenterDelegate

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .list]
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        guard let link = response.notification.request.content.userInfo["url"] as? String, let url = URL(string: link) else { return }
        await MainActor.run { self.onOpen?(url) }
    }
}
