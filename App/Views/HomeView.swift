import SwiftUI
import LernwerkCore

struct HomeView: View {
    @Environment(AppModel.self) private var model
    @State private var showSettings = false
    @State private var path = NavigationPath()
    @State private var handledLaunch = false

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    TodayHeader()
                    if let target = model.continueTarget {
                        ContinueCard(course: target.course, lesson: target.lesson)
                    }
                    if !model.dueCards.isEmpty {
                        ReviewTeaser(count: model.dueCards.count)
                    }
                    if !model.courses.isEmpty {
                        PathTeaser()
                    }
                    SectionTitle(title: "Fächer", trailing: model.courses.count == 1 ? "1 Kurs" : "\(model.courses.count) Kurse")
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 320), spacing: 14, alignment: .top)], spacing: 14) {
                        ForEach(model.subjects) { subject in
                            SubjectCard(subject: subject)
                        }
                    }
                    if model.courses.isEmpty {
                        ContentUnavailableView("Noch keine Inhalte", systemImage: "icloud.and.arrow.down",
                                               description: Text("Zieh nach unten, um die Lektionen von GitHub zu laden."))
                    }
                    if model.runtimeHeld {
                        Label("Neue Lektionstypen brauchen eine neuere App-Version. Bis dahin läuft die bisherige.", systemImage: "arrow.down.app")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .card(padding: 12, radius: 18)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 24)
                .readableColumn()
            }
            .background { TintBackground(tints: model.courses.prefix(3).map(\.tint)) }
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
            .refreshable { await model.syncContent(force: true) }
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

struct TodayHeader: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        let goal = max(1, model.state.dailyGoal)
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(Date().formatted(.dateTime.weekday(.wide).day().month(.wide).locale(germanLocale)))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(greeting)
                    .font(.title2.bold())
                HStack(spacing: 14) {
                    Label("\(model.streak) \(model.streak == 1 ? "Tag" : "Tage")", systemImage: "flame.fill")
                        .foregroundStyle(.orange)
                    Label("\(model.todayXP) / \(goal) Punkte", systemImage: "bolt.fill")
                        .foregroundStyle(.secondary)
                }
                .font(.subheadline.weight(.medium))
                .labelStyle(.titleAndIcon)
            }
            Spacer()
            ZStack {
                GoalRing(value: Double(model.todayXP) / Double(goal), tint: .accentColor, lineWidth: 8)
                Image(systemName: model.todayXP >= goal ? "checkmark" : "bolt.fill")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(model.todayXP >= goal ? Color.green : Color.accentColor)
            }
            .frame(width: 64, height: 64)
            .accessibilityElement()
            .accessibilityLabel("Tagesziel: \(model.todayXP) von \(goal) Punkten")
        }
        .card()
    }

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: Date())
        switch h {
        case 5..<11: return "Guten Morgen"
        case 11..<17: return "Schön, dass du da bist"
        case 17..<22: return "Guten Abend"
        default: return "Noch eine Runde?"
        }
    }
}

struct ContinueCard: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var lesson: LessonRef

    var body: some View {
        let step = model.state.lessons[lesson.id]?.lastStep ?? 0
        Button {
            model.start(course, lesson)
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    CourseBadge(course: course, size: 44)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(step > 0 ? "Weitermachen" : "Als Nächstes")
                            .font(.caption.weight(.semibold))
                            .textCase(.uppercase)
                            .foregroundStyle(course.tint)
                        Text(lesson.title)
                            .font(.headline)
                            .multilineTextAlignment(.leading)
                        Text([course.title, course.chapter(of: lesson.id)?.title].compactMap { $0 }.joined(separator: " · "))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                }
                HStack {
                    if let m = lesson.minutes { Label(Format.minutes(m), systemImage: "clock").font(.footnote).foregroundStyle(.secondary) }
                    Spacer()
                    Text(step > 0 ? "Fortsetzen" : "Starten")
                        .font(.subheadline.weight(.semibold))
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(course.tint, in: .capsule)
                        .foregroundStyle(.white)
                }
            }
            .card()
            .overlay(alignment: .topTrailing) {
                Circle().fill(course.tint.opacity(0.18)).frame(width: 120, height: 120).blur(radius: 30).offset(x: 30, y: -40).allowsHitTesting(false)
            }
            .clipShape(.rect(cornerRadius: 26, style: .continuous))
        }
        .buttonStyle(PressableStyle())
    }
}

struct ReviewTeaser: View {
    @Environment(AppModel.self) private var model
    var count: Int

    var body: some View {
        Button {
            model.startReview()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "arrow.clockwise")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Color.orange.gradient, in: .rect(cornerRadius: 12, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(count == 1 ? "1 Aufgabe ist fällig" : "\(count) Aufgaben sind fällig")
                        .font(.headline)
                    Text("Kurze Wiederholung, damit es hängen bleibt")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
            .card(padding: 14)
        }
        .buttonStyle(PressableStyle())
    }
}

struct CourseCard: View {
    @Environment(AppModel.self) private var model
    var course: Course

    var body: some View {
        let done = model.state.completedCount(in: course)
        let ready = course.readyLessons.count
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                CourseBadge(course: course, size: 48)
                VStack(alignment: .leading, spacing: 2) {
                    Text(course.title).font(.headline)
                    if let s = course.subtitle {
                        Text(s).font(.footnote).foregroundStyle(.secondary).lineLimit(2).multilineTextAlignment(.leading)
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
            ProgressLine(value: model.progress(of: course), tint: course.tint)
            Text("\(done) von \(ready) Lektionen · \(course.lessons.count - ready) in Arbeit")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .foregroundStyle(.primary)
        .card()
    }
}
