import { Tray, Menu, app, BrowserWindow } from 'electron';
import path from 'path';
import { resetMessageCount } from '../windows/main';
import { getSettings } from './settings';

export function createTray(
    mainWindow: BrowserWindow | null,
    setQuitting: (value: boolean) => void
): Tray {
    const trayIconPath = path.join(__dirname, '../../assets/app.ico');
    const tray = new Tray(trayIconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Messenger',
            click: () => openMessenger(mainWindow, tray)
        },
        {
            label: 'Quit',
            click: () => {
                setQuitting(true);
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Messenger');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => handleTrayClick(mainWindow, tray));

    return tray;
}

function openMessenger(mainWindow: BrowserWindow | null, tray: Tray): void {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        resetMessageCount(tray);
    }
}

function handleTrayClick(mainWindow: BrowserWindow | null, tray: Tray): void {
    const settings = getSettings();
    if (settings.minimizeToTray) {
        toggleMainWindow(mainWindow, tray);
    } else {
        openMessenger(mainWindow, tray);
    }
}

function toggleMainWindow(mainWindow: BrowserWindow | null, tray: Tray): void {
    if (!mainWindow) return;

    if (mainWindow.isVisible()) {
        mainWindow.hide();
    } else {
        openMessenger(mainWindow, tray);
    }
}
