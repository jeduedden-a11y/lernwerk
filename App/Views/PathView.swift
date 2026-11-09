import SwiftUI
import UIKit
import LernwerkCore

/// Navigation value for the learning path; subject preselects a subject's trees.
struct PathRoute: Hashable {
    var subject: String?
}

/// The learning path: subject overview and a skill tree per course, drawn by the runtime (runtime/overview.js),
/// so its look can change without a new IPA. Lessons and training rounds start from here.
struct PathView: View {
    @Environment(AppModel.self) private var model
    var subject: String?

    @State private var controller = LessonController()
    @State private var openedSomething = false

    var body: some View {
        LessonWebView(locator: model.locator, controller: controller, startOptions: options(), onMessage: handle)
            .background { TintBackground(tints: model.courses.prefix(3).map(\.tint)) }
            .navigationTitle("Lernpfad")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: model.presentedLesson == nil) { _, closed in
                // back from a lesson or training round: draw the tree again with the new progress
                if closed, openedSomething {
                    openedSomething = false
                    controller.start(options())
                }
            }
    }

    private func options() -> [String: Any] {
        [
            "mode": "overview",
            "subject": subject ?? "",
            "progress": model.overviewProgress(),
            "theme": ["accent": model.courses.first?.color ?? "#5E5CE6", "fontScale": UIFontMetrics.default.scaledValue(for: 17) / 17],
            "insets": ["top": 6, "bottom": 6],
        ]
    }

    private func handle(_ message: RuntimeMessage) {
        switch message {
        case .open(let courseId, let lessonId):
            openedSomething = true
            model.openFromPath(courseId: courseId, lessonId: lessonId)
        case .practice(let courseId, let topicId, let level):
            openedSomething = true
            model.practiceFromPath(courseId: courseId, topicId: topicId, level: level)
        case .error(let text):
            model.toast = text
        default:
            break
        }
    }
}

/// Entry to the learning path on the home screen.
struct PathTeaser: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let all = model.courses.reduce(0) { $0 + $1.readyLessons.count }
        let done = model.courses.reduce(0) { $0 + model.state.completedCount(in: $1) }
        NavigationLink(value: PathRoute(subject: nil)) {
            HStack(spacing: 12) {
                Image(systemName: "point.3.connected.trianglepath.dotted")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(
                        LinearGradient(colors: [Color(hex: "#26A65B"), Color(hex: "#E8930C"), Color(hex: "#E5484D"), Color(hex: "#8E4EC6")],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
                        in: .rect(cornerRadius: 12, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Dein Lernpfad")
                        .font(.headline)
                    Text("\(done) von \(all) Lektionen · alle Fächer als Baum")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
            .card(padding: 14)
        }
        .buttonStyle(PressableStyle())
        .accessibilityLabel("Lernpfad, \(done) von \(all) Lektionen")
    }
}
