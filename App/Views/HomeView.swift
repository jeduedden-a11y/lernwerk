import SwiftUI
import LernwerkCore

// Home screen: progress per subject at a glance, three actions, and every subject with its next lesson.
// Everything that can be tapped sits on Liquid Glass; the page itself stays plain, with a faint warm glow at the top.
// Motion is calm: things come up once when the page opens, a tap on a bar finds its subject, a subject zooms open,
// a long press shows a preview with quick actions, a swipe starts training (left) or the learning path (right).
struct HomeView: View {
    @Environment(AppModel.self) private var model
    @State private var showSettings = false
    @State private var path = NavigationPath()
    @State private var handledLaunch = false
    @State private var highlighted: String?
    @Namespace private var zoom

    var body: some View {
        NavigationStack(path: $path) {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        Text(HomeDate.line(for: Date()))
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                            .appearOnce(0)

                        if !model.subjects.isEmpty {
                            ProgressOverview { subject in
                                highlighted = subject.id
                                withAnimation(.smooth(duration: 0.45)) { proxy.scrollTo(subject.id, anchor: .center) }
                                Task { @MainActor in
                                    try? await Task.sleep(nanoseconds: 1_600_000_000)
                                    withAnimation(.smooth) { if highlighted == subject.id { highlighted = nil } }
                                }
                            }
                            .appearOnce(1)
                            HomeActions()
                                .appearOnce(2)
                            VStack(alignment: .leading, spacing: 10) {
                                SectionTitle(title: "Fächer")
                                VStack(spacing: 10) {
                                    ForEach(Array(model.subjectsByRecent.enumerated()), id: \.element.id) { offset, subject in
                                        SubjectLane(subject: subject, highlighted: highlighted == subject.id) {
                                            path.append(PathRoute(subject: subject.id))
                                        }
                                        .id(subject.id)
                                        .appearOnce(3 + offset)
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
                    .navigationTransition(.zoom(sourceID: "course:" + course.id, in: zoom))
            }
            .navigationDestination(for: Subject.self) { subject in
                SubjectView(subject: subject)
                    .navigationTransition(.zoom(sourceID: "subject:" + subject.id, in: zoom))
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
        .environment(\.zoomNamespace, zoom)
        .sensoryFeedback(.selection, trigger: path.count) { old, new in new > old }
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
/// it is done. The bars grow once when the page opens; a tap on one finds its subject below. Below the bars: points
/// today, days in a row, due reviews. The title row opens Fortschritt.
struct ProgressOverview: View {
    @Environment(AppModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    @Environment(\.accessibilityReduceMotion) private var systemReduce
    var onPick: (Subject) -> Void
    @State private var grown = false
    @State private var picks = 0

    var body: some View {
        let still = MotionSettings.reduced(system: systemReduce)
        let subjects = model.subjects
        let ready = subjects.map { s in model.courses(in: s).reduce(0) { $0 + $1.readyLessons.count } }
        let settled = subjects.map { s in model.courses(in: s).reduce(0) { $0 + model.state.settledCount(in: $1) } }
        let total = ready.reduce(0, +)
        let done = settled.reduce(0, +)
        let goal = max(1, model.state.dailyGoal)
        let up = grown || still
        VStack(alignment: .leading, spacing: 12) {
            Button {
                model.selectedTab = .stats
            } label: {
                HStack(alignment: .firstTextBaseline) {
                    Text("Fortschritt").font(.headline)
                    Spacer(minLength: 8)
                    Text("\(up ? done : 0) von \(total) Lektionen")
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(.secondary)
                        .contentTransition(.numericText(value: Double(up ? done : 0)))
                    Image(systemName: "chevron.right")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.tertiary)
                }
                .foregroundStyle(.primary)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityHint("Öffnet den Fortschritt")

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
                                .frame(height: max(3, geo.size.height * (up ? share : 0)))
                                .animation(still ? nil : .spring(duration: 0.75, bounce: 0.12).delay(Double(i) * 0.04), value: up)
                        }
                        .frame(width: w)
                        .contentShape(.rect)
                        .onTapGesture {
                            picks += 1
                            onPick(subject)
                        }
                        .accessibilityElement()
                        .accessibilityLabel("\(subject.title), \(Int((share * 100).rounded())) Prozent")
                        .accessibilityAddTraits(.isButton)
                        .accessibilityAction { onPick(subject) }
                    }
                }
            }
            .frame(height: 58)
            .clipShape(.rect(cornerRadius: 10, style: .continuous))

            HStack(spacing: 0) {
                stat(up ? model.todayXP : 0, "/\(goal)", "Punkte heute")
                Divider().frame(height: 28)
                stat(up ? model.streak : 0, "", model.streak == 1 ? "Tag in Folge" : "Tage in Folge")
                Divider().frame(height: 28)
                stat(up ? model.dueCards.count : 0, "", "fällig")
            }
            .animation(still ? nil : .smooth(duration: 0.8), value: up)
        }
        .card(padding: 14, radius: 24)
        .sensoryFeedback(.selection, trigger: picks)
        .onAppear { grown = true }
    }

    private func stat(_ value: Int, _ suffix: String, _ label: String) -> some View {
        VStack(spacing: 1) {
            Text("\(value)\(suffix)")
                .font(.headline.monospacedDigit())
                .contentTransition(.numericText(value: Double(value)))
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }
}

/// Daily mix, due reviews and the learning path, one tap each.
struct HomeActions: View {
    @Environment(AppModel.self) private var model
    @State private var taps = 0

    var body: some View {
        let due = model.dueCards.count
        GlassEffectContainer(spacing: 8) {
            HStack(spacing: 10) {
                Button {
                    taps += 1
                    if model.canStartMix { model.startMix() } else { model.selectedTab = .review }
                } label: {
                    action("shuffle", "Tagesmix")
                }
                .accessibilityHint(model.canStartMix ? "Startet den Tagesmix" : "Öffnet Üben")
                Button {
                    taps += 1
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
        .sensoryFeedback(.impact(weight: .light), trigger: taps)
    }

    private func action(_ symbol: String, _ title: String) -> some View {
        VStack(spacing: 5) {
            Image(systemName: symbol)
                .font(.body.weight(.semibold))
                .foregroundStyle(Color.accentColor)
                .symbolEffect(.bounce, value: taps)
            Text(title)
                .font(.caption.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 6)
    }
}

/// One subject: its colour, the next lesson, how far it is. The row zooms into the subject (or its only course); the
/// round button starts the next lesson right away. A long press shows a preview with quick actions; a swipe to the
/// left starts training, to the right opens the subject's learning path.
struct SubjectLane: View {
    @Environment(AppModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    var subject: Subject
    var highlighted = false
    var onPath: () -> Void
    @State private var dragX: CGFloat = 0
    @State private var armed = 0
    @State private var starts = 0

    private static let reach: CGFloat = 72

    var body: some View {
        let courses = model.courses(in: subject)
        let next = model.nextLesson(in: subject)
        let share = model.progress(of: subject)
        let training = model.trainingTarget(in: subject)
        let single = courses.count == 1 ? courses.first : nil
        HStack(spacing: 12) {
            if let single {
                NavigationLink(value: single) { label(next: next, share: share) }
                    .buttonStyle(.plain)
            } else {
                NavigationLink(value: subject) { label(next: next, share: share) }
                    .buttonStyle(.plain)
            }
            if let next {
                Button {
                    starts += 1
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
        .glassEffect(.regular.interactive(), in: .rect(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .strokeBorder(subject.pigment(scheme), lineWidth: 2)
                .opacity(highlighted ? 1 : 0)
        }
        .zoomSource(single.map { "course:" + $0.id } ?? "subject:" + subject.id)
        .contextMenu {
            if let next {
                Button {
                    model.start(next.course, next.lesson)
                } label: {
                    Label("Weiterlernen: \(next.lesson.title)", systemImage: "play.fill")
                }
            }
            if let training {
                Button {
                    model.startPractice(training.course, training.topic, level: training.level)
                } label: {
                    Label("Training: \(training.topic.title)", systemImage: "dumbbell")
                }
            }
            Button {
                onPath()
            } label: {
                Label("Lernpfad", systemImage: "point.3.connected.trianglepath.dotted")
            }
        } preview: {
            SubjectPreview(subject: subject, next: next, share: share)
                .environment(model)
        }
        .offset(x: dragX)
        .background { swipeHints(training: training != nil) }
        .simultaneousGesture(
            DragGesture(minimumDistance: 18)
                .onChanged { v in
                    let dx = v.translation.width, dy = v.translation.height
                    guard abs(dx) > abs(dy) * 1.4 else { return }
                    // a soft rubber band beyond the point where the action triggers
                    let limit = Self.reach * 1.5
                    dragX = dx.magnitude <= Self.reach ? dx : (dx > 0 ? 1 : -1) * min(limit, Self.reach + (dx.magnitude - Self.reach) * 0.35)
                    let state = dx > Self.reach ? 1 : (dx < -Self.reach && training != nil ? -1 : 0)
                    if state != armed { armed = state }
                }
                .onEnded { v in
                    let dx = v.translation.width
                    if abs(dx) > abs(v.translation.height) * 1.4 {
                        if dx > Self.reach {
                            onPath()
                        } else if dx < -Self.reach, let training {
                            model.startPractice(training.course, training.topic, level: training.level)
                        }
                    }
                    withAnimation(.spring(duration: 0.35, bounce: 0.2)) {
                        dragX = 0
                        armed = 0
                    }
                }
        )
        .sensoryFeedback(.impact(weight: .light), trigger: armed) { _, new in new != 0 }
        .sensoryFeedback(.impact(weight: .medium), trigger: starts)
        .animation(.smooth(duration: 0.3), value: highlighted)
        .accessibilityAction(named: "Lernpfad öffnen") { onPath() }
        .accessibilityAction(named: "Training starten") {
            if let training { model.startPractice(training.course, training.topic, level: training.level) }
        }
    }

    /// What a swipe will do, uncovered under the row while it moves.
    private func swipeHints(training: Bool) -> some View {
        HStack {
            Label("Lernpfad", systemImage: "point.3.connected.trianglepath.dotted")
                .opacity(dragX > 8 ? min(1, Double(dragX) / Double(Self.reach)) : 0)
            Spacer()
            if training {
                Label("Training", systemImage: "dumbbell")
                    .opacity(dragX < -8 ? min(1, Double(-dragX) / Double(Self.reach)) : 0)
            }
        }
        .font(.subheadline.weight(.semibold))
        .labelStyle(.iconOnly)
        .imageScale(.large)
        .foregroundStyle(subject.pigment(scheme))
        .padding(.horizontal, 22)
        .symbolEffect(.bounce, value: armed)
        .accessibilityHidden(true)
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

/// The long-press preview of a subject: its courses with their progress and the next lesson.
struct SubjectPreview: View {
    @Environment(AppModel.self) private var model
    @Environment(\.colorScheme) private var scheme
    var subject: Subject
    var next: (course: Course, lesson: LessonRef)?
    var share: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                SubjectBadge(subject: subject, size: 44)
                VStack(alignment: .leading, spacing: 2) {
                    Text(subject.title).font(.title3.bold())
                    Text("\(Int((share * 100).rounded())) Prozent abgeschlossen")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            if let next {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Als Nächstes").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    Text(next.lesson.title).font(.headline)
                    Text(next.course.chapter(of: next.lesson.id)?.title ?? next.course.title)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            VStack(spacing: 8) {
                ForEach(model.courses(in: subject)) { course in
                    HStack(spacing: 10) {
                        Text(course.title).font(.subheadline).lineLimit(1)
                        Spacer(minLength: 8)
                        ProgressLine(value: model.progress(of: course), tint: course.pigment(scheme), height: 4)
                            .frame(width: 90)
                    }
                }
            }
        }
        .padding(18)
        .frame(width: 320, alignment: .leading)
        .background(scheme == .dark ? Color.black : Color.warmPaper)
    }
}
