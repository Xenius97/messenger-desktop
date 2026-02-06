import { Menu, MenuItem, BrowserWindow, app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { APP_VERSION } from '../config/constants';
import { log } from '../utils/logger';

export function createAppMenu(mainWindow: BrowserWindow | null): Menu {
    const template: (MenuItem | {})[] = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        if (mainWindow) {
                            const current = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(current + 0.5);
                            log('Zoomed in: ' + (current + 0.5));
                        }
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+Minus',
                    click: () => {
                        if (mainWindow) {
                            const current = mainWindow.webContents.getZoomLevel();
                            mainWindow.webContents.setZoomLevel(Math.max(current - 0.5, -3));
                            log('Zoomed out: ' + Math.max(current - 0.5, -3));
                        }
                    }
                },
                {
                    label: 'Reset Zoom',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                            log('Zoom reset');
                        }
                    }
                },
                { type: 'separator' },
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' }
            ]
        },
        {
            label: 'Update',
            submenu: [
                {
                    label: 'Check for Updates...',
                    click: () => {
                        log('Manual update check initiated');
                        autoUpdater.checkForUpdates().catch(err => {
                            log('Update check failed: ' + err.message);
                        });
                    }
                },
                {
                    label: 'Auto Update: ON',
                    type: 'checkbox',
                    checked: true,
                    click: (menuItem: MenuItem) => {
                        const enabled = menuItem.checked;
                        autoUpdater.autoDownload = enabled;
                        autoUpdater.autoInstallOnAppQuit = enabled;
                        const label = enabled ? 'Auto Update: ON' : 'Auto Update: OFF';
                        menuItem.label = label;
                        log('Auto updater ' + (enabled ? 'enabled' : 'disabled'));
                    }
                },
                { type: 'separator' },
                {
                    label: 'Version: ' + APP_VERSION,
                    enabled: false
                }
            ]
        },
        /*{
            label: 'Help',
            submenu: [
                {
                    label: 'About Messenger Desktop',
                    click: () => {
                        log('About clicked');
                    }
                }
            ]
        }*/
    ];

    const menu = Menu.buildFromTemplate(template as any);
    return menu;
}

export function setupMenuBar(mainWindow: BrowserWindow | null): void {
    if (!mainWindow) return;
    
    const appMenu = createAppMenu(mainWindow);
    Menu.setApplicationMenu(appMenu);
    log('Application menu initialized');
}
