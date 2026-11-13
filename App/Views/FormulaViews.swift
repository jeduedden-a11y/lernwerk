import SwiftUI
import LernwerkCore

/// The formulas of one or more courses, rendered by the runtime (mode "formulas"): searchable, filterable, those of
/// the current lesson marked and listed first.
struct FormulaPanel: View {
    @Environment(AppModel.self) private var model
    var courses: [Course]
    var lessonID: String? = nil
    var accentHex: String
    var topInset: CGFloat = 12
    @State private var controller = LessonController()

    var body: some View {
        LessonWebView(locator: model.locator, controller: controller, startOptions: options, onMessage: { _ in })
    }

    private var options: [String: Any] {
        var formulas: [String: Any] = [
            "courses": courses.map(\.id),
            "kicker": courses.count == 1 ? courses[0].title : "Formeln",
        ]
        if let lessonID { formulas["lessonId"] = lessonID }
        if courses.count > 1 { formulas["title"] = "Formelsammlung" }
        return [
            "mode": "formulas",
            "formulaUrls": model.formulaURLs,
            "formulas": formulas,
            "theme": ["accent": accentHex, "fontScale": UIFontMetrics.default.scaledValue(for: 17) / 17] as [String: Any],
            "insets": ["top": topInset, "bottom": 28],
        ]
    }
}

/// Formula collection as a sheet: from the course page, the subject page or (on the iPhone) from a lesson.
struct FormulaSheet: View {
    @Environment(\.dismiss) private var dismiss
    var courses: [Course]
    var lessonID: String? = nil
    var accentHex: String

    var body: some View {
        FormulaPanel(courses: courses, lessonID: lessonID, accentHex: accentHex, topInset: 18)
            .ignoresSafeArea(edges: .bottom)
            .overlay(alignment: .topTrailing) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark")
                        .font(.body.weight(.semibold))
                        .frame(width: 22, height: 22)
                }
                .buttonStyle(.glass)
                .buttonBorderShape(.circle)
                .controlSize(.large)
                .padding(14)
                .accessibilityLabel("Formelsammlung schließen")
            }
            .presentationDragIndicator(.visible)
    }
}

/// On the course page: formula collection, formula training and the formula cards in the review.
struct FormulaCard: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var book: FormulaBook
    @Binding var practiceTarget: PracticeTarget?
    @State private var showCollection = false

    var body: some View {
        let topic = course.practiceTopics.first { $0.id == "formeln" }
        let cards = model.formulaCardCount(course)
        let total = book.formulas.count
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Label("Formeln", systemImage: "function")
                    .font(.title3.bold())
                    .foregroundStyle(course.tint)
                Spacer()
                Text(total == 1 ? "1 Formel" : "\(total) Formeln")
                    .font(.footnote.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            Text(cards == 0
                 ? "Nach jeder Lektion kommen ihre Formeln als Karten in die Wiederholung, jedes Mal anders gefragt."
                 : "\(cards) von \(total) Formeln sind als Karten in der Wiederholung.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
            GlassEffectContainer(spacing: 10) {
                HStack(spacing: 10) {
                    Button {
                        showCollection = true
                    } label: {
                        Label("Sammlung", systemImage: "book.pages")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.glass)
                    if let topic {
                        Button {
                            practiceTarget = PracticeTarget(course: course, topic: topic)
                        } label: {
                            Label("Training", systemImage: "dumbbell")
                                .font(.subheadline.weight(.semibold))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.glass)
                        .disabled(!model.isUnlocked(topic))
                    }
                }
                .controlSize(.large)
            }
            if cards < total {
                Button {
                    model.addAllFormulaCards(course)
                } label: {
                    Label("Alle Formeln in die Wiederholung", systemImage: "rectangle.stack.badge.plus")
                        .font(.footnote.weight(.semibold))
                }
                .buttonStyle(.plain)
                .foregroundStyle(course.tint)
            }
        }
        .card()
        .sheet(isPresented: $showCollection) {
            FormulaSheet(courses: [course], accentHex: course.color)
                .environment(model)
        }
    }
}
