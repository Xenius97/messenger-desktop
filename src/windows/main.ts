import { BrowserWindow, Menu, shell, Session } from 'electron';
import { WINDOW_CONFIG, WEB_PREFERENCES } from '../config/windows';
import { MESSENGER_URL, APP_TITLE } from '../config/constants';
import { isMessengerUrl, isFacebookUrl } from '../utils/url';
import { startLoadingAnimation, stopLoadingAnimation } from '../utils/animation';
import { updateTaskbarBadge } from '../utils/taskbar';
import { createExternalWindow } from './external';

let mainWindow: BrowserWindow | null = null;
let lastMessageCount = 0;

export function createMainWindow(tray: Electron.Tray | null, isQuitting: () => boolean): BrowserWindow {
    mainWindow = new BrowserWindow({
        ...WINDOW_CONFIG.main,
        webPreferences: WEB_PREFERENCES,
    });

    const webContents = mainWindow.webContents;

    setupPermissionHandler(webContents.session);
    setupContextMenu(webContents);
    setupLoadingIndicators(webContents);
    setupMessageCountMonitor(webContents, tray);
    setupNavigationHandlers(webContents);

    // Don't await - let ready-to-show event trigger
    mainWindow.loadURL(MESSENGER_URL);

    // Note: ready-to-show is handled in main.ts to close splash window
    mainWindow.on('close', (event) => {
        if (!isQuitting() && mainWindow) {
            event.preventDefault();
            mainWindow.hide();

            if (process.platform === 'win32') {
                mainWindow.setSkipTaskbar(true);
            }
        }
    });

    return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export function resetMessageCount(tray: Electron.Tray | null): void {
    lastMessageCount = 0;
    if (tray && !tray.isDestroyed()) {
        tray.setToolTip('Messenger');
    }
    if (process.platform === 'win32') {
        updateTaskbarBadge(mainWindow, 0);
    }
}

function setupPermissionHandler(session: Session): void {
    session.setPermissionRequestHandler((webContents, permission, callback) => {
        callback(permission === 'notifications');
    });
}

function setupContextMenu(webContents: Electron.WebContents): void {
    webContents.on('context-menu', () => {
        const menu = Menu.buildFromTemplate([
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' },
            { type: 'separator' },
            { role: 'reload' },
        ]);
        menu.popup();
    });
}

function setupLoadingIndicators(webContents: Electron.WebContents): void {
    if (!mainWindow) return;

    webContents.on('did-start-loading', () => {
        if (mainWindow) {
            startLoadingAnimation(mainWindow);
            mainWindow.setProgressBar(2);
        }
    });

    webContents.on('did-stop-loading', () => {
        if (mainWindow) {
            stopLoadingAnimation(mainWindow);
            mainWindow.setProgressBar(-1);
        }
    });

    webContents.on('did-navigate-in-page', () => {
        if (mainWindow) startLoadingAnimation(mainWindow);
    });

    webContents.on('did-frame-finish-load', () => {
        if (mainWindow) stopLoadingAnimation(mainWindow);
    });
}

function setupMessageCountMonitor(webContents: Electron.WebContents, tray: Electron.Tray | null): void {
    webContents.on('page-title-updated', (event, title) => {
        const match = title.match(/\((\d+)\)/);

        if (match) {
            const messageCount = parseInt(match[1], 10);
            console.log('Message count detected:', messageCount, 'Last count:', lastMessageCount);

            if (messageCount > lastMessageCount && lastMessageCount >= 0) {
                const newMessages = messageCount - lastMessageCount;
                console.log('Sending notification for', newMessages, 'new messages');

                if (process.platform === 'win32' && tray && !tray.isDestroyed()) {
                    tray.displayBalloon({
                        title: 'Messenger',
                        content: `${newMessages} new message${newMessages > 1 ? 's' : ''} received`,
                        icon: WINDOW_CONFIG.main.icon as string
                    });
                }
            }

            lastMessageCount = messageCount;

            if (tray && !tray.isDestroyed()) {
                tray.setToolTip(messageCount > 0 ? `Messenger (${messageCount} unread)` : 'Messenger');
            }

            if (process.platform === 'win32') {
                updateTaskbarBadge(mainWindow, messageCount);
            }
        } else if (title === APP_TITLE) {
            lastMessageCount = 0;
            if (tray && !tray.isDestroyed()) {
                tray.setToolTip('Messenger');
            }

            if (process.platform === 'win32') {
                updateTaskbarBadge(mainWindow, 0);
            }
        }
    });
}

function setupNavigationHandlers(webContents: Electron.WebContents): void {
    webContents.setWindowOpenHandler(({ url }) => {
        if (isMessengerUrl(url)) {
            return { action: 'allow' };
        }
        if (isFacebookUrl(url)) {
            createExternalWindow(url);
            return { action: 'deny' };
        }
        shell.openExternal(url);
        return { action: 'deny' };
    });

    webContents.on('will-navigate', (event, url) => {
        if (!isMessengerUrl(url)) {
            event.preventDefault();
            if (isFacebookUrl(url)) {
                createExternalWindow(url);
            } else {
                shell.openExternal(url);
            }
        }
    });
}
