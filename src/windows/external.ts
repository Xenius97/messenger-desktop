import { BrowserWindow, shell, Session } from 'electron';
import { WINDOW_CONFIG, WEB_PREFERENCES } from '../config/windows';
import { isMessengerUrl, isFacebookUrl } from '../utils/url';

export function createExternalWindow(url: string): BrowserWindow {
    const externalWindow = new BrowserWindow({
        ...WINDOW_CONFIG.external,
        webPreferences: WEB_PREFERENCES,
    });

    const webContents = externalWindow.webContents;

    setupPermissionHandler(webContents.session);
    setupNavigationHandlers(webContents, externalWindow);
    setupDownloadHandler(webContents.session, externalWindow);

    externalWindow.loadURL(url);
    return externalWindow;
}

function setupPermissionHandler(session: Session): void {
    session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(permission === 'notifications');
    });
}

function setupNavigationHandlers(webContents: Electron.WebContents, window: BrowserWindow): void {
    const handleNavigation = (event: Electron.Event, url: string) => {
        if (isMessengerUrl(url)) {
            event.preventDefault();
            redirectToMainWindow(url, window);
        } else if (!isFacebookUrl(url)) {
            event.preventDefault();
            shell.openExternal(url);
            if (!window.isDestroyed()) {
                window.close();
            }
        }
    };

    webContents.on('will-navigate', handleNavigation);
    webContents.on('did-redirect-navigation', handleNavigation);

    webContents.on('did-navigate', (event, url) => {
        if (isMessengerUrl(url)) {
            redirectToMainWindow(url, window);
        } else if (!isFacebookUrl(url)) {
            shell.openExternal(url);
            if (!window.isDestroyed()) {
                window.close();
            }
        }
    });
}

function setupDownloadHandler(session: Session, window: BrowserWindow): void {
    session.on('will-download', (event, item) => {
        item.once('done', () => {
            if (!window.isDestroyed()) {
                window.close();
            }
        });
    });
}

function redirectToMainWindow(url: string, windowToClose: BrowserWindow): void {
    if (windowToClose && !windowToClose.isDestroyed()) {
        windowToClose.destroy();
    }

    // This will be handled by the main window manager
    const { getMainWindow } = require('./main');
    const mainWindow = getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(url);
        mainWindow.focus();
    }
}
