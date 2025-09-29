# SSH Live - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SSH Live Application                     │
├─────────────────────────────────────────────────────────────┤
│  Electron Main Process (Node.js)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   SSH Manager   │  │   Key Manager   │  │  Settings   │ │
│  │                 │  │                 │  │  Manager    │ │
│  │ • Connections   │  │ • Key Storage   │  │ • App Config│ │
│  │ • SFTP          │  │ • Encryption    │  │ • User Prefs│ │
│  │ • Commands      │  │ • Generation    │  │ • Security  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Electron Renderer Process (React Frontend)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Connection     │  │    Terminal     │  │    File     │ │
│  │   Manager       │  │     View        │  │  Transfer   │ │
│  │                 │  │                 │  │             │ │
│  │ • Connect UI    │  │ • xterm.js      │  │ • SFTP UI   │ │
│  │ • Connection    │  │ • SSH Commands  │  │ • File Ops  │ │
│  │   List          │  │ • Real-time     │  │ • Upload/   │ │
│  │ • Auth Forms    │  │   Output        │  │   Download  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Key Manager   │  │   Settings      │  │  Status Bar │ │
│  │                 │  │    Panel        │  │             │ │
│  │ • Key List      │  │                 │  │ • Connection│ │
│  │ • Generate UI   │  │ • Theme Config  │  │   Status    │ │
│  │ • Import/Export │  │ • Security      │  │ • Time      │ │
│  │ • Key Storage   │  │ • Terminal      │  │ • Version   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    External SSH Servers                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Server 1  │  │   Server 2  │  │   Server N  │         │
│  │             │  │             │  │             │         │
│  │ • SSH Port  │  │ • SSH Port  │  │ • SSH Port  │         │
│  │ • SFTP      │  │ • SFTP      │  │ • SFTP      │         │
│  │ • Commands  │  │ • Commands  │  │ • Commands  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Component Details

### 1. Electron Main Process

#### SSH Manager (`ssh-manager.ts`)
- **Purpose**: Manages SSH connections and communication
- **Key Features**:
  - Connection lifecycle management
  - Command execution
  - SFTP operations
  - Connection pooling and reconnection
- **Dependencies**: `ssh2` library, EventEmitter

#### Key Manager (`key-manager.ts`)
- **Purpose**: Handles SSH key storage and encryption
- **Key Features**:
  - Key generation (RSA, ED25519, ECDSA)
  - Secure key storage with encryption
  - Key import/export functionality
  - Fingerprint generation and validation
- **Security**: Private keys encrypted before storage

#### Settings Manager (`settings-manager.ts`)
- **Purpose**: Application configuration management
- **Key Features**:
  - User preferences storage
  - Theme and UI settings
  - Security configurations
  - Connection defaults
- **Storage**: JSON-based configuration with validation

### 2. Electron Renderer Process (React Frontend)

#### Connection Manager (`ConnectionManager.tsx`)
- **Purpose**: UI for managing SSH connections
- **Features**:
  - Connection form with validation
  - Authentication method selection
  - Connection status display
  - Connection history

#### Terminal View (`TerminalView.tsx`)
- **Purpose**: Interactive terminal interface
- **Features**:
  - xterm.js integration
  - Real-time command execution
  - Terminal customization
  - Session management
- **Dependencies**: xterm.js, xterm-addon-fit

#### File Transfer (`FileTransfer.tsx`)
- **Purpose**: SFTP file management interface
- **Features**:
  - Remote file browser
  - Drag & drop upload/download
  - File permissions display
  - Progress indicators

#### Key Manager UI (`KeyManager.tsx`)
- **Purpose**: SSH key management interface
- **Features**:
  - Key generation wizard
  - Import/export functionality
  - Key fingerprint display
  - Secure key handling

#### Settings Panel (`SettingsPanel.tsx`)
- **Purpose**: Application configuration UI
- **Features**:
  - Theme selection
  - Security settings
  - Terminal preferences
  - Advanced options

### 3. Security Architecture

#### Data Encryption
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│   Encryption    │───▶│   Secure        │
│                 │    │   Layer         │    │   Storage       │
│ • Passwords     │    │ • AES-256       │    │ • Encrypted     │
│ • Private Keys  │    │ • Key Derivation│    │ • File System   │
│ • Sensitive Data│    │ • Salt/Hash     │    │ • OS Keychain   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### IPC Security
- Context isolation enabled
- Node integration disabled
- Preload script for secure API exposure
- Input validation and sanitization

### 4. Cross-Platform Considerations

#### File System Paths
- **macOS**: `~/Library/Application Support/ssh-live/`
- **Windows**: `%APPDATA%/ssh-live/`
- **Linux**: `~/.config/ssh-live/`

#### Native Integration
- **macOS**: Native title bar, proper app bundle
- **Windows**: NSIS installer, Windows-style UI
- **Linux**: AppImage and DEB packages

#### Platform-Specific Features
- **macOS**: Keychain integration for passwords
- **Windows**: Windows Credential Manager
- **Linux**: GNOME Keyring support

## 🔄 Data Flow

### Connection Establishment
1. User enters connection details in UI
2. Frontend validates input
3. IPC call to main process
4. SSH Manager creates connection
5. Authentication (password/key)
6. Connection established
7. Status updates sent to frontend

### Command Execution
1. User types command in terminal
2. xterm.js captures input
3. IPC call to SSH Manager
4. Command sent via SSH
5. Output streamed back to terminal
6. Real-time display in UI

### File Transfer
1. User selects files for upload
2. File data read from local filesystem
3. SFTP connection established
4. File transfer initiated
5. Progress updates sent to UI
6. Transfer completion notification

## 🛡️ Security Measures

### Data Protection
- Private keys encrypted with AES-256
- Passwords never stored in plain text
- Secure IPC communication
- Input validation and sanitization

### Network Security
- SSH2 protocol compliance
- Host key verification
- Connection timeouts
- Secure key exchange

### Application Security
- Code signing for distributions
- Auto-update with signature verification
- No external network calls without user consent
- Local-only data storage

## 📊 Performance Considerations

### Memory Management
- Connection pooling
- Terminal buffer limits
- Efficient file transfer streaming
- Garbage collection optimization

### Network Optimization
- Connection keep-alive
- Compression support
- Bandwidth throttling
- Connection multiplexing

### UI Performance
- Virtual scrolling for large file lists
- Debounced input handling
- Efficient re-rendering with React
- Lazy loading of components

## 🔮 Future Enhancements

### Planned Features
- SSH tunneling support
- Port forwarding UI
- Connection profiles
- Plugin system
- Cloud sync for settings

### Technical Improvements
- WebAssembly for crypto operations
- Native terminal rendering
- GPU acceleration
- Multi-threading support

