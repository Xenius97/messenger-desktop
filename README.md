# Messenger Desktop - TypeScript Edition

Modern Messenger Desktop application built with Electron and TypeScript.

## Features

- 🚀 Native desktop experience for Messenger
- 🔔 Desktop notifications with unread message counter
- 🔄 Automatic updates via GitHub Releases
- 🎨 System tray integration
- 📦 Portable and installer versions

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Start development
npm start

# Watch mode (auto-compile on change)
npm run dev
```

### Building

```bash
# Build installer
npm run build:installer

# Build portable version
npm run build:portable
```

## Known Issues

- 2FA can be tricky - use SMS verification if login fails
- Make sure to check "remember me" during login
