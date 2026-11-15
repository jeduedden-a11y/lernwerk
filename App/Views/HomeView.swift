import SwiftUI
import LernwerkCore

// Home screen: progress per subject at a glance, three actions, and every subject with its next lesson.
// Everything that can be tapped sits on Liquid Glass; the page itself stays plain, with a faint warm glow at the top.
struct HomeView: View {
    @Environment(AppModel.self) private var model
    @State private var showSettings = false
    @State private var path = NavigationPath()
    @State private var handledLaunch = false

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text(HomeDate.line(for: Date()))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)

                    if !model.subjects.isEmpty {
                        ProgressOverview()
                        HomeActions()
                        VStack(alignment: .leading, spacing: 10) {
                            SectionTitle(title: "Fächer")
                            VStack(spacing: 10) {
                                ForEach(model.subjectsByRecent) { subject in
                                    SubjectLane(subject: subject)
                                }
                            }
                        }
                    }
                    if model.courses.isEmpty {
                        ContentUnavailableView("Noch keine Inhalte", systemImage: "icloud.and.arrow.down",
                                               description: Text("Zum Laden der Lektionen nach unten ziehen."))
                    }
                    if model.runtimeHeld {
                        Label("Neue Lektionstypen brauchen eine neuere App-Version. Bis dahin läuft die bisherige.", systemImage: "arrow.down.app")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .card(padding: 12, radius: 18)
                    }
                }
                .padding(.horizontal)
                .padding(.top, 2)
                .padding(.bottom, 28)
                .readableColumn()
            }
            .background { TintBackground(tints: [Color.accentColor]) }
            .navigationTitle("Lernen")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .accessibilityLabel("Einstellungen")
                }
            }
            .navigationDestination(for: Course.self) { course in
                CourseView(course: course)
            }
            .navigationDestination(for: Subject.self) { subject in
                SubjectView(subject: subject)
            }
            .navigationDestination(for: PathRoute.self) { route in
                PathView(subject: route.subject)
            }
            .refreshable {
                await model.syncProgress()
                await model.syncContent(force: true)
            }
            .sheet(isPresented: $showSettings) {
                SettingsView().environment(model)
            }
        }
        .onAppear {
            // launch arguments for screenshots: -LWCourse <id> opens a course, -LWSettings YES the settings
            guard !handledLaunch else { return }
            handledLaunch = true
            let defaults = UserDefaults.standard
            if let id = defaults.string(forKey: "LWCourse"), let c = model.course(id) { path.append(c) }
            if defaults.bool(forKey: "LWPath") { path.append(PathRoute(subject: defaults.string(forKey: "LWSubject"))) }
            if defaults.bool(forKey: "LWSettings") { showSettings = true }
        }
    }
}

enum HomeDate {
    /// "Sonntag, 15. November"
    static func line(for date: Date) -> String {
        date.formatted(.dateTime.weekday(.wide).day().month(.wide).locale(germanLocale))
    }
}

/// Progress of every subject as one row of bars: the width follows the size of the subject, the height how much of
/// it is done. Below: points today, days in a row, due reviews. A tap opens Fortschritt.
struct ProgressOverview: View {
    @Environment(AppModel.self) private var model
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        let subjects = model.subjects
        let ready = subjects.map { s in model.courses(in: s).reduce(0) { $0 + $1.readyLessons.count } }
        let settled = subjects.map { s in model.courses(in: s).reduce(0) { $0 + model.state.settledCount(in: $1) } }
        let total = ready.reduce(0, +)
        let done = settled.reduce(0, +)
        let goal = max(1, model.state.dailyGoal)
        Button {
            model.selectedTab = .stats
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Fortschritt").font(.headline)
                    Spacer(minLength: 8)
                    Text("\(done) von \(total) Lektionen")
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                GeometryReader { geo in
                    let gap: CGFloat = 3
                    let width = max(0, geo.size.width - gap * CGFloat(max(0, subjects.count - 1)))
                    HStack(alignment: .bottom, spacing: gap) {
                        ForEach(Array(subjects.enumerated()), id: \.element.id) { i, subject in
                            let share = ready[i] == 0 ? 0 : Double(settled[i]) / Double(ready[i])
                            let w = total == 0 ? width / CGFloat(max(1, subjects.count)) : width * CGFloat(ready[i]) / CGFloat(total)
                            ZStack(alignment: .bottom) {
                                Rectangle().fill(Color.primary.opacity(0.08))
                                Rectangle()
                                    .fill(subject.pigment(scheme))
                                    .frame(height: max(3, geo.size.height * share))
                            }
                            .frame(width: w)
                        }
                    }
                }
                .frame(height: 58)
                .clipShape(.rect(cornerRadius: 10, style: .continuous))
                .accessibilityHidden(true)

                HStack(spacing: 0) {
                    stat("\(model.todayXP)/\(goal)", "Punkte heute")
                    Divider().frame(height: 28)
                    stat("\(model.streak)", model.streak == 1 ? "Tag in Folge" : "Tage in Folge")
                    Divider().frame(height: 28)
                    stat("\(model.dueCards.count)", "fällig")
                }
            }
            .foregroundStyle(.primary)
            .card(padding: 14, radius: 24)
            .contentShape(.rect)
        }
        .buttonStyle(PressableStyle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Fortschritt: \(done) von \(total) Lektionen, \(model.todayXP) von \(goal) Punkten heute, \(model.streak) Tage in Folge, \(model.dueCards.count) Aufgaben fällig")
        .accessibilityHint("Öffnet den Fortschritt")
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 1) {
            Text(value).font(.headline.monospacedDigit())
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

/// Daily mix, due reviews and the learning path, one tap each.
struct HomeActions: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let due = model.dueCards.count
        GlassEffectContainer(spacing: 8) {
            HStack(spacing: 10) {
                Button {
                    if model.canStartMix { model.startMix() } else { model.selectedTab = .review }
                } label: {
                    action("shuffle", "Tagesmix")
                }
                .accessibilityHint(model.canStartMix ? "Startet den Tagesmix" : "Öffnet Üben")
                Button {
                    if due > 0 { model.startReview() } else { model.selectedTab = .review }
                } label: {
                    action("arrow.counterclockwise", "Wiederholen")
                }
                .accessibilityHint(due > 0 ? "\(due) Aufgaben fällig" : "Öffnet Üben")
                NavigationLink(value: PathRoute(subject: nil)) {
                    action("point.3.connected.trianglepath.dotted", "Lernpfad")
                }
            }
            .buttonStyle(.glass)
            .buttonBorderShape(.roundedRectangle(radius: 18))
        }
    }

    private func action(_ symbol: String, _ title: String) -> some View {
        VStack(spacing: 5) {
            Image(systemName: symbol)
                .font(.body.weight(.semibold))
                .foregroundStyle(Color.accentColor)
            Text(title)
                .font(.caption.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
    }
}

/// One subject: its colour, the next lesson, how far it is. The row opens the subject (or its only course); the
/// round button starts the next lesson right away.
struct SubjectLane: View {
    @Environment(AppModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    var subject: Subject

    var body: some View {
        let courses = model.courses(in: subject)
        let next = model.nextLesson(in: subject)
        let share = model.progress(of: subject)
        HStack(spacing: 12) {
            if courses.count == 1, let only = courses.first {
                NavigationLink(value: only) { label(next: next, share: share) }
                    .buttonStyle(.plain)
            } else {
                NavigationLink(value: subject) { label(next: next, share: share) }
                    .buttonStyle(.plain)
            }
            if let next {
                Button {
                    model.start(next.course, next.lesson)
                } label: {
                    Image(systemName: "play.fill")
                        .font(.footnote.weight(.bold))
                        .frame(width: 18, height: 18)
                }
                .buttonStyle(.glassProminent)
                .buttonBorderShape(.circle)
                .tint(subject.tint)
                .accessibilityLabel("\(next.lesson.title) starten")
            }
        }
        .padding(.vertical, 10)
        .padding(.leading, 12)
        .padding(.trailing, 10)
        .glassEffect(.regular, in: .rect(cornerRadius: 20, style: .continuous))
    }

    private func label(next: (course: Course, lesson: LessonRef)?, share: Double) -> some View {
        HStack(spacing: 12) {
            Capsule()
                .fill(subject.pigment(scheme))
                .frame(width: 4)
                .frame(maxHeight: .infinity)
            VStack(alignment: .leading, spacing: 3) {
                HStack(alignment: .firstTextBaseline) {
                    Text(subject.title).font(.headline)
                    Spacer(minLength: 8)
                    Text("\(Int((share * 100).rounded())) %")
                        .font(.footnote.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                Text(next?.lesson.title ?? "Alle Lektionen abgeschlossen")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                ProgressLine(value: share, tint: subject.pigment(scheme), height: 4)
                    .padding(.top, 4)
            }
        }
        .fixedSize(horizontal: false, vertical: true)
        .foregroundStyle(.primary)
        .contentShape(.rect)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(subject.title), \(Int((share * 100).rounded())) Prozent" + (next.map { ", als Nächstes \($0.lesson.title)" } ?? ""))
    }
}
