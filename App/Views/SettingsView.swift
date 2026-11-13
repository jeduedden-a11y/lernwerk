import SwiftUI
import LernwerkCore

struct SettingsView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var dismiss

    @AppStorage("reduceMotion") private var reduceMotion = false
    @AppStorage("reminderOn") private var reminderOn = false
    @AppStorage("reminderHour") private var reminderHour = 18
    @AppStorage("reminderMinute") private var reminderMinute = 0
    @AppStorage("badgeOn") private var badgeOn = true
    @State private var notificationsDenied = false

    // Edited locally and written back on "Fertig", so a half-typed token never reaches the keychain.
    @State private var vault = VaultSettings()
    @State private var token = ""
    @State private var passphrase = ""
    @State private var source = ContentSource()
    @State private var loaded = false
    @State private var testing = false
    @State private var testResult: String?
    @State private var confirmReset = false

    private let goals = [10, 20, 30, 50, 80]

    var body: some View {
        @Bindable var model = model
        NavigationStack {
            Form {
                if model.isDemo {
                    Section {
                        Label("Demo-Modus: Nichts wird gespeichert oder gesendet.", systemImage: "theatermasks")
                            .font(.subheadline)
                    }
                }

                Section {
                    Picker("Tagesziel", selection: $model.state.dailyGoal) {
                        ForEach(goals, id: \.self) { Text("\($0) Punkte").tag($0) }
                    }
                } header: {
                    Text("Lernen")
                } footer: {
                    Text("Eine neue Lektion bringt 10 Punkte und 2 für jede Aufgabe, die beim ersten Versuch sitzt. In der Wiederholung gibt es 2 Punkte je Aufgabe und einen mehr, wenn sie sofort sitzt. Eine Klausur bringt 3 Punkte je richtiger Aufgabe und 10 dazu ab 80 Prozent.")
                }

                Section {
                    Toggle("Tägliche Erinnerung", isOn: $reminderOn)
                    if reminderOn {
                        DatePicker("Uhrzeit", selection: reminderTime, displayedComponents: .hourAndMinute)
                    }
                    Toggle("Fällige Wiederholungen am App-Symbol", isOn: $badgeOn)
                } header: {
                    Text("Erinnerungen")
                } footer: {
                    Text(notificationsDenied
                         ? "Mitteilungen sind für Lernwerk in den iOS-Einstellungen ausgeschaltet. Unter Einstellungen › Mitteilungen › Lernwerk lassen sie sich einschalten."
                         : "Die Erinnerung nennt, wie viele Wiederholungen zu ihrer Uhrzeit fällig sind, und öffnet mit einem Tipp den Tagesmix. Alles läuft auf dem Gerät, ohne Server.")
                }
                .onChange(of: reminderOn) { _, _ in updateReminders(ask: true) }
                .onChange(of: badgeOn) { _, _ in updateReminders(ask: true) }
                .onChange(of: reminderHour) { _, _ in updateReminders(ask: false) }
                .onChange(of: reminderMinute) { _, _ in updateReminders(ask: false) }
                .task { notificationsDenied = await Reminders.shared.isDenied() }

                Section {
                    Toggle("Weniger Bewegung", isOn: $reduceMotion)
                } header: {
                    Text("Darstellung")
                } footer: {
                    Text("Animationen in den Lektionen springen gleich ans Ende, Seiten scrollen ohne Gleiten. Gilt auch, wenn »Bewegung reduzieren« in den Bedienungshilfen von iOS an ist.")
                }

                Section {
                    LabeledContent("Weiter lernen", value: "lernwerk://weiter")
                    LabeledContent("Wiederholen", value: "lernwerk://wiederholen")
                    LabeledContent("Tagesmix", value: "lernwerk://tagesmix")
                } header: {
                    Text("Kurzbefehle")
                } footer: {
                    Text("In der Kurzbefehle-App eine Aktion »URL öffnen« mit einem dieser Links anlegen und über »Zum Home-Bildschirm« ablegen. Ein Tipp darauf startet Lernwerk direkt an dieser Stelle.")
                }
                .textSelection(.enabled)

                Section {
                    TextField("GitHub-Benutzername", text: $vault.owner)
                        .textContentType(.username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    TextField("Daten-Repo", text: $vault.repo)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    SecureField("Token", text: $token)
                        .textContentType(.password)
                    SecureField("Passphrase", text: $passphrase)
                        .textContentType(.password)
                    Button {
                        Task { await test() }
                    } label: {
                        HStack {
                            Text("Verbindung prüfen")
                            Spacer()
                            if testing { ProgressView() }
                        }
                    }
                    .disabled(testing || model.isDemo)
                    if let testResult {
                        Text(testResult)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                } header: {
                    Text("Vault über Tagwerk Bridge")
                } footer: {
                    Text("Dieselben Angaben wie in Tagwerk: das private Daten-Repo, ein Token mit Lese- und Schreibrecht nur für dieses Repo und deine Passphrase. Token und Passphrase bleiben im Schlüsselbund des iPhones.")
                }

                Section("Stand der Brücke") {
                    LabeledContent("Plugin", value: model.state.bridgePluginVersion.map { "Tagwerk Bridge \($0)" } ?? "noch nicht gelesen")
                    LabeledContent("Lernnotizen", value: model.bridgeReady ? "werden angenommen" : "ab Plugin 1.3")
                    LabeledContent("Wartende Änderungen", value: "\(model.notesWaiting)")
                    LabeledContent("Zuletzt gesendet", value: Format.relative(model.state.lastPush))
                    if let error = model.state.lastSyncError {
                        Text(error).font(.footnote).foregroundStyle(.red)
                    }
                    if model.notesWaiting > 0 && model.isVaultConfigured {
                        Button("Notizen jetzt senden") {
                            Task { await model.pushNotes() }
                        }
                    }
                }

                Section {
                    LabeledContent("Lektionen", value: "\(readyCount) fertig, \(plannedCount) geplant")
                    LabeledContent("Zuletzt geladen", value: Format.relative(model.lastContentSync))
                    LabeledContent("Lektions-Runtime", value: runtimeVersion)
                    Button {
                        Task { await model.syncContent(force: true) }
                    } label: {
                        HStack {
                            Text("Jetzt aktualisieren")
                            Spacer()
                            if model.contentPhase == .busy { ProgressView() }
                        }
                    }
                    .disabled(model.contentPhase == .busy || model.isDemo)
                    if case .failed(let message) = model.contentPhase {
                        Text(message).font(.footnote).foregroundStyle(.red)
                    }
                    if model.runtimeHeld {
                        Text("Auf GitHub liegt eine Lektions-Runtime, die eine neuere App braucht. Bis zur Neuinstallation läuft die bisherige weiter.")
                            .font(.footnote)
                            .foregroundStyle(.orange)
                    }
                    DisclosureGroup("Quelle") {
                        TextField("Benutzer", text: $source.owner)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                        TextField("Repo", text: $source.repo)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                        TextField("Branch", text: $source.branch)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    }
                } header: {
                    Text("Inhalte")
                } footer: {
                    Text("Lektionen, Aufgaben und Visualisierungen kommen aus dem öffentlichen Repo und sind danach offline da. Neu installieren musst du nur, wenn sich die App selbst ändert.")
                }

                Section {
                    Button("Lernfortschritt zurücksetzen", role: .destructive) { confirmReset = true }
                } footer: {
                    Text("Löscht abgeschlossene Lektionen, Wiederholungen und Punkte. Notizen bleiben.")
                }

                Section("Über") {
                    LabeledContent("Version", value: appVersion)
                    if let url = URL(string: "https://github.com/\(source.owner)/\(source.repo)") {
                        Link("Quelltext und Inhalte auf GitHub", destination: url)
                    }
                }
            }
            .navigationTitle("Einstellungen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fertig") {
                        save()
                        dismiss()
                    }
                }
            }
            .confirmationDialog("Lernfortschritt zurücksetzen?", isPresented: $confirmReset, titleVisibility: .visible) {
                Button("Zurücksetzen", role: .destructive) { model.resetProgress() }
            } message: {
                Text("Abgeschlossene Lektionen, Wiederholungen und Punkte werden gelöscht. Deine Notizen bleiben.")
            }
            .onChange(of: model.state.dailyGoal) { _, _ in model.scheduleSave() }
        }
        .onAppear(perform: load)
        .onDisappear(perform: save)
    }

    private var readyCount: Int { model.courses.reduce(0) { $0 + $1.readyLessons.count } }
    private var plannedCount: Int { model.courses.reduce(0) { $0 + $1.lessons.count } - readyCount }

    private var runtimeVersion: String {
        model.locator.decode(RuntimeInfo.self, "runtime/runtime.json")?.version ?? "nicht gefunden"
    }

    private var appVersion: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        return "\(short), Hülle \(AppModel.shellVersion)"
    }

    private func load() {
        guard !loaded else { return }
        loaded = true
        vault = model.vault
        source = model.contentSource
        if !model.isDemo {
            token = model.token
            passphrase = model.passphrase
        }
    }

    private func save() {
        guard loaded, !model.isDemo else { return }
        var v = vault
        v.owner = v.owner.trimmingCharacters(in: .whitespacesAndNewlines)
        v.repo = v.repo.trimmingCharacters(in: .whitespacesAndNewlines)
        if v != model.vault { model.update(vault: v) }
        if token != model.token { model.token = token }
        if passphrase != model.passphrase { model.passphrase = passphrase }
        var s = source
        s.owner = s.owner.trimmingCharacters(in: .whitespacesAndNewlines)
        s.repo = s.repo.trimmingCharacters(in: .whitespacesAndNewlines)
        s.branch = s.branch.trimmingCharacters(in: .whitespacesAndNewlines)
        if s != model.contentSource, !s.owner.isEmpty, !s.repo.isEmpty, !s.branch.isEmpty {
            model.update(contentSource: s)
            Task { await model.syncContent(force: true) }
        }
    }

    private func test() async {
        save()
        testing = true
        testResult = await model.testVault()
        testing = false
    }
}

extension SettingsView {
    /// The reminder time as a date for the picker; only hour and minute are kept.
    var reminderTime: Binding<Date> {
        Binding {
            Calendar.current.date(bySettingHour: reminderHour, minute: reminderMinute, second: 0, of: Date()) ?? Date()
        } set: { date in
            let parts = Calendar.current.dateComponents([.hour, .minute], from: date)
            reminderHour = parts.hour ?? 18
            reminderMinute = parts.minute ?? 0
        }
    }

    func updateReminders(ask: Bool) {
        Task {
            if ask && (reminderOn || badgeOn) { _ = await Reminders.shared.requestPermission() }
            notificationsDenied = await Reminders.shared.isDenied()
            await Reminders.shared.refresh(state: model.state)
        }
    }
}
