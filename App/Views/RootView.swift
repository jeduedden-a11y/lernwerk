import SwiftUI
import LernwerkCore

struct RootView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        @Bindable var model = model
        TabView(selection: $model.selectedTab) {
            Tab("Lernen", systemImage: "books.vertical.fill", value: AppTab.learn) {
                HomeView()
            }
            Tab("Üben", systemImage: "arrow.clockwise", value: AppTab.review) {
                ReviewView()
            }
            .badge(model.dueCards.count)
            Tab("Vault", systemImage: "books.vertical", value: AppTab.notes) {
                VaultView()
            }
            .badge(model.notesWaiting)
            Tab("Fortschritt", systemImage: "chart.bar.fill", value: AppTab.stats) {
                StatsView()
            }
            // Five entries at most on the iPhone, otherwise the system adds "Mehr". The search tab sits apart.
            Tab(value: AppTab.search, role: .search) {
                SearchView()
            }
        }
        .tabViewStyle(.sidebarAdaptable)
        .tabBarMinimizeBehavior(.onScrollDown)
        .tabViewBottomAccessory {
            ContinueAccessory()
        }
        .fullScreenCover(item: $model.presentedLesson) { session in
            LessonPlayerView(session: session)
                .environment(model)
        }
        .overlay(alignment: .top) { ToastView() }
        // lernwerk://weiter, lernwerk://wiederholen, lernwerk://tagesmix (for shortcuts on the home screen)
        .onOpenURL { model.open($0) }
        .task {
            model.openLaunchTarget()
            await model.syncContent()
            await model.pushNotes(quiet: true)
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active:
                Task {
                    await Reminders.shared.refresh(state: model.state)
                    await model.syncContent()
                    await model.pushNotes(quiet: true)
                }
            case .background:
                model.saveNow()
                // the badge and the reminders of the next days follow what was learned just now
                Task { await Reminders.shared.refresh(state: model.state) }
            default:
                break
            }
        }
    }
}

/// Above the tab bar: continue where you left off.
struct ContinueAccessory: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        if let target = model.continueTarget {
            Button {
                model.start(target.course, target.lesson)
            } label: {
                HStack(spacing: 10) {
                    CourseBadge(course: target.course, size: 28)
                    VStack(alignment: .leading, spacing: 0) {
                        Text(target.lesson.title)
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(1)
                        Text(subtitle(target))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "play.fill")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(target.course.tint)
                }
                .padding(.horizontal, 14)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)
            .accessibilityHint("Startet die Lektion")
        } else {
            Label("Alle verfügbaren Lektionen geschafft", systemImage: "checkmark.seal.fill")
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 14)
        }
    }

    private func subtitle(_ t: (course: Course, lesson: LessonRef)) -> String {
        let step = model.state.lessons[t.lesson.id]?.lastStep ?? 0
        return step > 0 ? "\(t.course.title) · weiter bei Schritt \(step + 1)" : "\(t.course.title) · als Nächstes"
    }
}

struct ToastView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        if let message = model.toast {
            Text(message)
                .font(.subheadline.weight(.semibold))
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .glassEffect(.regular, in: .capsule)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
                .task(id: message) {
                    try? await Task.sleep(nanoseconds: 2_400_000_000)
                    withAnimation(.smooth) { model.toast = nil }
                }
        }
    }
}
