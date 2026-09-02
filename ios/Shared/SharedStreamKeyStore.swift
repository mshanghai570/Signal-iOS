import Foundation
import Security

struct SharedStreamKeyStore {
    private let service = "com.signal.broadcast.youtube"
    private let account = "stream-key"

    func save(_ streamKey: String) throws {
        let value = streamKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { throw ConfigurationError.missingStreamKey }

        let query = baseQuery
        let attributes = [kSecValueData: Data(value.utf8)] as CFDictionary
        let updateStatus = SecItemUpdate(query as CFDictionary, attributes)
        if updateStatus == errSecItemNotFound {
            var newItem = query
            newItem[kSecValueData] = Data(value.utf8)
            let addStatus = SecItemAdd(newItem as CFDictionary, nil)
            guard addStatus == errSecSuccess else { throw KeychainError.status(addStatus) }
        } else if updateStatus != errSecSuccess {
            throw KeychainError.status(updateStatus)
        }
    }

    func load() throws -> String {
        var query = baseQuery
        query[kSecReturnData] = true
        query[kSecMatchLimit] = kSecMatchLimitOne

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8),
              !value.isEmpty else {
            if status == errSecItemNotFound { throw ConfigurationError.missingStreamKey }
            throw KeychainError.status(status)
        }
        return value
    }

    private var baseQuery: [CFString: Any] {
        [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: account,
            kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
    }
}

enum KeychainError: LocalizedError {
    case status(OSStatus)

    var errorDescription: String? {
        switch self {
        case .status(let status): "Keychain operation failed (OSStatus \(status))."
        }
    }
}
