import { app, BrowserWindow, Tray } from 'electron';
import path from 'path';
import { createMainWindow } from './windows/main';
import { createSplashWindow } from './windows/splash';
import { createTray } from './managers/tray';
import { setupAutoUpdater } from './managers/auto-updater';

// Application state
let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Set user data path
const dataFolderName = process.env.PORTABLE_EXECUTABLE_DIR 
    ? 'MessengerDesktopData' 
    : 'MessengerDesktop';
app.setPath('userData', path.join(app.getPath('appData'), dataFolderName));

// Single instance lock
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });
}

// Set App User Model ID for Windows
if (process.platform === 'win32') {
    app.setAppUserModelId('com.messenger.desktop');
}

// App lifecycle events
app.whenReady().then(async () => {
    await initializeApp();
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Initialize application
async function initializeApp(): Promise<void> {
    try {
        // Create splash window
        splashWindow = createSplashWindow();

        // Create main window
        mainWindow = createMainWindow(tray, () => isQuitting);

        // Create tray
        tray = createTray(mainWindow, (value: boolean) => {
            isQuitting = value;
        });

        // Close splash when main is ready
        mainWindow.once('ready-to-show', () => {
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.destroy();
                splashWindow = null;
            }
            if (mainWindow) {
                mainWindow.show();
            }
        });

        // Setup auto updater
        setupAutoUpdater();

    } catch (error) {
        console.error('Failed to initialize app:', error);
        app.quit();
    }
}
