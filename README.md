# SSH Live - Modern SSH Client

A beautiful, secure, and cross-platform SSH client built with Electron, React, and TypeScript.

![SSH Live](https://img.shields.io/badge/SSH-Live-blue?style=for-the-badge&logo=terminal)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

### 🔐 Security First
- **SSH Key Management**: Generate, import, and manage SSH keys with secure encryption
- **Secure Storage**: All sensitive data is encrypted and stored securely
- **Password Protection**: Optional password protection for saved connections
- **Auto-lock**: Automatic session locking for enhanced security

### 🎨 Beautiful UI
- **Modern Design**: Clean, intuitive interface with dark/light themes
- **Responsive Layout**: Adapts to different screen sizes
- **Customizable**: Extensive theming and customization options
- **Animations**: Smooth transitions and micro-interactions

### 🚀 Powerful Features
- **Multiple Connections**: Manage multiple SSH connections simultaneously
- **Terminal Integration**: Full-featured terminal with xterm.js
- **File Transfer**: SFTP file upload/download with drag & drop
- **Session Management**: Save and restore connection sessions
- **Command History**: Persistent command history across sessions

### 🌍 Cross-Platform
- **macOS**: Native macOS app with proper integration
- **Windows**: Full Windows support with native look & feel
- **Linux**: AppImage and DEB packages for various distributions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ssh-live.git
   cd ssh-live
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Building for Production

```bash
# Build for all platforms
npm run dist

# Build for specific platform
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

## 📖 Usage

### Creating Your First Connection

1. **Open SSH Live** and click "New Connection"
2. **Enter connection details**:
   - Host: Your server IP or hostname
   - Port: SSH port (default: 22)
   - Username: Your SSH username
   - Authentication: Password or SSH key
3. **Click Connect** to establish the connection
4. **Start using the terminal** or transfer files via SFTP

### Managing SSH Keys

1. **Generate a new key**:
   - Go to SSH Keys section
   - Click "Generate New"
   - Choose key type (ED25519 recommended)
   - Enter a name for your key
2. **Import existing keys**:
   - Click "Import Key"
   - Paste your public/private key pair
3. **Use keys for authentication**:
   - Select "Use SSH Key Authentication" when creating connections
   - Choose your key from the dropdown

### File Transfer

1. **Connect to your server** first
2. **Switch to File Transfer** tab
3. **Browse remote files** using the file browser
4. **Upload files** by clicking the upload button
5. **Download files** by clicking the download icon

## 🛠️ Development

### Project Structure

```
ssh-live/
├── electron/          # Electron main process
│   ├── main.ts       # Main application entry
│   ├── preload.ts    # Preload script for security
│   ├── ssh-manager.ts # SSH connection management
│   ├── key-manager.ts # SSH key management
│   └── settings-manager.ts # Settings management
├── src/              # React frontend
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── App.tsx       # Main React component
│   └── main.tsx      # React entry point
├── dist/             # Built application
└── release/          # Packaged applications
```

### Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron 28
- **Styling**: Tailwind CSS
- **SSH**: ssh2 (Node.js SSH2 library)
- **Terminal**: xterm.js
- **Icons**: Lucide React
- **Build**: electron-builder

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run dist         # Package for distribution
npm run preview      # Preview production build
```

## 🔧 Configuration

### Settings

SSH Live stores settings in:
- **macOS**: `~/Library/Application Support/ssh-live/`
- **Windows**: `%APPDATA%/ssh-live/`
- **Linux**: `~/.config/ssh-live/`

### SSH Keys

SSH keys are stored securely in:
- **macOS**: `~/.ssh-live/keys/`
- **Windows**: `%USERPROFILE%/.ssh-live/keys/`
- **Linux**: `~/.ssh-live/keys/`

## 🔒 Security

### Data Protection
- All private keys are encrypted before storage
- Passwords are never stored in plain text
- Secure IPC communication between processes
- No telemetry or data collection by default

### Best Practices
- Use SSH keys instead of passwords when possible
- Enable auto-lock for shared computers
- Regularly update SSH keys
- Use strong passphrases for encrypted keys

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Electron](https://electronjs.org/) - Cross-platform desktop apps
- [React](https://reactjs.org/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [ssh2](https://github.com/mscdex/ssh2) - SSH2 client library

## 📞 Support

- 📧 Email: support@ssh-live.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ssh-live/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/ssh-live/discussions)

---

Made with ❤️ for the SSH community

