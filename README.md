# Messenger Desktop - TypeScript Edition

Modern Messenger Desktop application built with Electron and TypeScript.

## Features

- 🚀 Native desktop experience for Messenger
- 🔔 Desktop notifications with unread message counter
- 🔄 Automatic updates via GitHub Releases
- 🎨 System tray integration
- 📦 Portable and installer versions

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── constants.ts # App constants
│   └── windows.ts   # Window configurations
├── managers/        # Feature managers
│   ├── auto-updater.ts
│   └── tray.ts
├── utils/           # Utility functions
│   ├── animation.ts
│   ├── taskbar.ts
│   └── url.ts
├── windows/         # Window creators
│   ├── external.ts
│   ├── main.ts
│   ├── splash.ts
│   └── update-progress.ts
├── types/           # TypeScript type definitions
│   └── index.ts
└── main.ts          # Application entry point
```

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

## Publishing Updates

1. Update version in `package.json`
2. Set `GH_TOKEN` environment variable with your GitHub Personal Access Token
3. Run `npm run publish`
4. Users will automatically receive update notifications

## Tech Stack

- **Electron** - Desktop framework
- **TypeScript** - Type-safe JavaScript
- **electron-updater** - Auto-update functionality
- **canvas** - Taskbar badge rendering

## Known Issues

- 2FA can be tricky - use SMS verification if login fails
- Make sure to check "remember me" during login
