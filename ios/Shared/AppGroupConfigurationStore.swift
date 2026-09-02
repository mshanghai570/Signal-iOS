import Foundation

struct AppGroupConfigurationStore {
    private let defaults: UserDefaults
    private let configurationKey = "broadcast.session.configuration"

    init() throws {
        guard let defaults = UserDefaults(suiteName: BroadcastSessionConfiguration.appGroupIdentifier) else {
            throw ConfigurationError.missingConfiguration
        }
        self.defaults = defaults
    }

    func save(_ configuration: BroadcastSessionConfiguration) throws {
        defaults.set(try JSONEncoder().encode(configuration), forKey: configurationKey)
    }

    func load() throws -> BroadcastSessionConfiguration {
        guard let data = defaults.data(forKey: configurationKey) else {
            throw ConfigurationError.missingConfiguration
        }
        return try JSONDecoder().decode(BroadcastSessionConfiguration.self, from: data)
    }
}
