import SwiftUI
import LernwerkCore

// Home screen. Following the HIG, Liquid Glass stays in the functional layer: the navigation bar with its
// settings button, the floating tab bar and its accessory. Everything that scrolls is content on standard
// material, and each view has a single prominent action (the first card of "Als Nächstes").
struct HomeView: View {
    @Environment(AppModel.self) private var model
    @State private var showSettings = false
    @State private var path = NavigationPath()
    @State private var handledLaunch = false

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 26) {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(HomeGreeting.line(for: Date()))
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                        TodayCard()
                    }
                    .padding(.horizontal)

                    let next = model.upNext
                    if !next.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            SectionTitle(title: "Als Nächstes")
                                .padding(.horizontal)
                            UpNextShelf(items: next)
                        }
                    }

                    if !model.courses.isEmpty {
                        QuickTiles()
                            .padding(.horizontal)
                    }

                    VStack(alignment: .leading, spacing: 10) {
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
                }
                .padding(.top, 2)
                .padding(.bottom, 28)
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

enum HomeGreeting {
    /// "Guten Abend · Montag, 9. November"
    static func line(for date: Date) -> String {
        let day = date.formatted(.dateTime.weekday(.wide).day().month(.wide).locale(germanLocale))
        return greeting(hour: Calendar.current.component(.hour, from: date)) + " · " + day
    }

    static func greeting(hour: Int) -> String {
        switch hour {
        case 5..<11: return "Guten Morgen"
        case 11..<17: return "Schön, dass du da bist"
        case 17..<22: return "Guten Abend"
        default: return "Noch eine Runde?"
        }
    }
}

/// Daily goal and streak in one place, the first thing to read on the screen.
struct TodayCard: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        let goal = max(1, model.state.dailyGoal)
        let xp = model.todayXP
        let reached = xp >= goal
        let layout = typeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: 14))
            : AnyLayout(HStackLayout(alignment: .center, spacing: 16))
        layout {
            ZStack {
                GoalRing(value: Double(xp) / Double(goal), tint: .accentColor, lineWidth: 9)
                Image(systemName: reached ? "checkmark" : "bolt.fill")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(reached ? Color.green : Color.accentColor)
            }
            .frame(width: 68, height: 68)
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 3) {
                Text("Tagesziel")
                    .font(.caption.weight(.semibold))
                    .textCase(.uppercase)
                    .foregroundStyle(.secondary)
                Text("\(xp) von \(goal) Punkten")
                    .font(.title3.bold())
                    .monospacedDigit()
                    .contentTransition(.numericText())
                Text(reached ? "Geschafft. Alles Weitere ist Bonus." : "Noch \(goal - xp) bis zum Ziel")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            if !typeSize.isAccessibilitySize { Spacer(minLength: 8) }

            StreakBadge(days: model.streak)
        }
        .card()
        .accessibilityElement(children: .combine)
    }
}

struct StreakBadge: View {
    var days: Int

    var body: some View {
        VStack(spacing: 2) {
            Image(systemName: "flame.fill")
                .font(.title3)
                .foregroundStyle(.orange)
            Text("\(days)")
                .font(.title3.bold())
                .monospacedDigit()
            Text(days == 1 ? "Tag" : "Tage")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.secondary)
        }
        .frame(minWidth: 52)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Serie: \(days) \(days == 1 ? "Tag" : "Tage") in Folge")
    }
}

/// Horizontal shelf of the next lessons, one per course, paged card by card like Up Next in Podcasts.
struct UpNextShelf: View {
    var items: [UpNextItem]
    @Environment(\.horizontalSizeClass) private var hSize

    var body: some View {
        ScrollView(.horizontal) {
            LazyHStack(alignment: .top, spacing: 12) {
                ForEach(items) { item in
                    UpNextCard(course: item.course, lesson: item.lesson, isPrimary: item.id == items.first?.id)
                        .containerRelativeFrame(.horizontal) { width, _ in
                            // the next card peeks in, so the shelf reads as scrollable
                            hSize == .regular ? (width - 12) * 0.49 : width * 0.84
                        }
                }
            }
            .scrollTargetLayout()
        }
        .contentMargins(.horizontal, 16, for: .scrollContent)
        .scrollTargetBehavior(.viewAligned)
        .scrollIndicators(.hidden)
    }
}

struct UpNextCard: View {
    @Environment(AppModel.self) private var model
    var course: Course
    var lesson: LessonRef
    /// Only the first card carries the prominent action; the others stay quiet (one prominent button per view).
    var isPrimary: Bool

    var body: some View {
        let step = model.state.lessons[lesson.id]?.lastStep ?? 0
        let total = model.meta(course, lesson)?.steps.count ?? 0
        let started = step > 0
        let shape = RoundedRectangle(cornerRadius: 24, style: .continuous)
        Button {
            model.start(course, lesson)
        } label: {
            VStack(alignment: .leading, spacing: 0) {
                LessonArtwork(course: course, caption: started ? "Weitermachen" : course.title)
                    .frame(height: 108)
                VStack(alignment: .leading, spacing: 5) {
                    Text(lesson.title)
                        .font(.headline)
                        .multilineTextAlignment(.leading)
                        .lineLimit(2, reservesSpace: true)
                    Text(course.chapter(of: lesson.id)?.title ?? course.title)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                    if started, total > 0 {
                        ProgressLine(value: Double(step) / Double(total), tint: course.tint)
                            .padding(.top, 5)
                    }
                    HStack(spacing: 8) {
                        if let m = lesson.minutes {
                            Label(Format.minutes(m), systemImage: "clock")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 0)
                        if isPrimary {
                            Text(started ? "Fortsetzen" : "Starten")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                // darkened course colour: white text keeps at least 4.5:1 on every course colour
                                .background(course.tint.mix(with: .black, by: 0.3), in: .capsule)
                        } else {
                            Image(systemName: "chevron.right")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .padding(.top, 6)
                }
                .padding(14)
            }
            .foregroundStyle(.primary)
            .background(.regularMaterial, in: shape)
            .clipShape(shape)
            .overlay { shape.strokeBorder(Color.primary.opacity(0.08), lineWidth: 0.5) }
            .contentShape(shape)
        }
        .buttonStyle(PressableStyle())
        .contextMenu {
            Button {
                model.skip(course, lesson)
            } label: {
                Label("Überspringen", systemImage: "forward.end")
            }
        }
        .accessibilityHint(started ? "Setzt die Lektion fort" : "Startet die Lektion")
        .accessibilityAction(named: "Überspringen") { model.skip(course, lesson) }
    }
}

/// Course colour as cover art: the gradient deepens towards the caption, so white text stays readable.
struct LessonArtwork: View {
    var course: Course
    var caption: String

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            LinearGradient(colors: [course.tint, course.tint.mix(with: .black, by: 0.38)],
                           startPoint: .topTrailing, endPoint: .bottomLeading)
            Image(systemName: course.symbol)
                .font(.system(size: 84, weight: .semibold))
                .foregroundStyle(.white.opacity(0.2))
                .rotationEffect(.degrees(-10))
                .offset(x: 18, y: 18)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .accessibilityHidden(true)
            Label(caption, systemImage: course.symbol)
                .font(.caption.weight(.bold))
                .textCase(.uppercase)
                .lineLimit(1)
                .foregroundStyle(.white)
                .padding(14)
        }
        .clipped()
    }
}

/// Review and learning path side by side; stacked at accessibility text sizes.
struct QuickTiles: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dynamicTypeSize) private var typeSize

    var body: some View {
        let due = model.dueCards.count
        let all = model.courses.reduce(0) { $0 + $1.readyLessons.count }
        let done = model.courses.reduce(0) { $0 + model.state.completedCount(in: $1) }
        let layout = typeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(spacing: 12))
            : AnyLayout(HStackLayout(alignment: .top, spacing: 12))
        layout {
            Button {
                if due > 0 { model.startReview() } else { model.selectedTab = .review }
            } label: {
                QuickTile(symbol: "arrow.clockwise",
                          colors: [Color(hex: "#F59E0B"), Color(hex: "#EA580C")],
                          title: "Wiederholen",
                          detail: due == 0 ? "Alles erledigt" : (due == 1 ? "1 Aufgabe fällig" : "\(due) Aufgaben fällig"))
            }
            .buttonStyle(PressableStyle())
            .accessibilityHint(due > 0 ? "Startet die Wiederholung" : "Öffnet Üben")

            Button {
                if model.canStartMix { model.startMix() } else { model.selectedTab = .review }
            } label: {
                QuickTile(symbol: "shuffle",
                          colors: MixCard.colors,
                          title: "Tagesmix",
                          detail: model.canStartMix ? "Altes und Neues gemischt" : "Ab der ersten Lektion")
            }
            .buttonStyle(PressableStyle())
            .accessibilityHint(model.canStartMix ? "Startet den Tagesmix" : "Öffnet Üben")

            NavigationLink(value: PathRoute(subject: nil)) {
                QuickTile(symbol: "point.3.connected.trianglepath.dotted",
                          colors: [Color(hex: "#26A65B"), Color(hex: "#E8930C"), Color(hex: "#E5484D"), Color(hex: "#8E4EC6")],
                          title: "Lernpfad",
                          detail: "\(done) von \(all) Lektionen")
            }
            .buttonStyle(PressableStyle())
        }
        .fixedSize(horizontal: false, vertical: true)
    }
}

struct QuickTile: View {
    var symbol: String
    var colors: [Color]
    var title: String
    var detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: symbol)
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
                .frame(width: 40, height: 40)
                .background(LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing),
                            in: .rect(cornerRadius: 11, style: .continuous))
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
        .foregroundStyle(.primary)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .card(padding: 14, radius: 22)
        .accessibilityElement(children: .combine)
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
