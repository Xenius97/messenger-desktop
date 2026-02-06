import { Tray, Menu, app, BrowserWindow } from 'electron';
import path from 'path';
import { resetMessageCount } from '../windows/main';

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

    tray.on('click', () => toggleMainWindow(mainWindow, tray));

    return tray;
}

function openMessenger(mainWindow: BrowserWindow | null, tray: Tray): void {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.setSkipTaskbar(false);
        mainWindow.focus();
        resetMessageCount(tray);
    }
}

function toggleMainWindow(mainWindow: BrowserWindow | null, tray: Tray): void {
    if (!mainWindow) return;

    if (mainWindow.isVisible()) {
        mainWindow.hide();
        if (process.platform === 'win32') {
            mainWindow.setSkipTaskbar(true);
        }
    } else {
        openMessenger(mainWindow, tray);
    }
}
