import SwiftUI

@main
struct LernwerkApp: App {
    @State private var model: AppModel

    init() {
        // Launch arguments become UserDefaults: -LWDemo YES -LWTab review -LWCourse oekonomik -LWLesson oek-markt
        let defaults = UserDefaults.standard
        let model = AppModel(demo: defaults.bool(forKey: "LWDemo"))
        if let tab = defaults.string(forKey: "LWTab").flatMap(AppTab.init(rawValue:)) {
            model.selectedTab = tab
        }
        _model = State(initialValue: model)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(model)
                .environment(\.locale, germanLocale)
        }
    }
}
