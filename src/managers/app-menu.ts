import { Menu, MenuItem, BrowserWindow, app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { APP_VERSION, APP_REPOSITORY } from '../config/constants';
import { log } from '../utils/logger';

export function createAppMenu(mainWindow: BrowserWindow | null): Menu {
    const template: (MenuItem | {})[] = [
        {
            label: 'Application',
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
                            // log('Zoomed in: ' + (current + 0.5));
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
                            // log('Zoomed out: ' + Math.max(current - 0.5, -3));
                        }
                    }
                },
                {
                    label: 'Reset Zoom',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.setZoomLevel(0);
                            // log('Zoom reset');
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
            label: 'Help',
            submenu: [
                {
                    label: 'Check for Updates...',
                    click: () => {
                        // log('Manual update check initiated');
                        autoUpdater.checkForUpdates().catch(err => {
                            log('Update check failed: ' + err.message);
                        });
                    }
                },
                {
                    label: 'Auto Update: ON',
                    type: 'checkbox',
                    checked: autoUpdater.autoDownload ? true : false,
                    click: (menuItem: MenuItem) => {
                        const enabled = menuItem.checked;
                        autoUpdater.autoDownload = enabled;
                        autoUpdater.autoInstallOnAppQuit = enabled;
                        const label = enabled ? 'Auto Update: ON' : 'Auto Update: OFF';
                        menuItem.label = label;
                        // log('Auto updater ' + (enabled ? 'enabled' : 'disabled'));

                        if (!enabled) {
                            dialog.showMessageBox(mainWindow!, {
                                type: 'info',
                                title: 'Auto Update',
                                message: 'Auto update has been disabled.',
                                detail: 'The application will no longer automatically download updates. You can still check for updates manually from this menu.',
                                buttons: ['OK']
                            });
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Open Repository',
                    click: () => {
                        require('electron').shell.openExternal(APP_REPOSITORY);
                    }
                },
                {
                    label: 'Version: ' + APP_VERSION,
                    enabled: false
                },
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template as any);
    return menu;
}

export function setupMenuBar(mainWindow: BrowserWindow | null): void {
    if (!mainWindow) return;
    
    const appMenu = createAppMenu(mainWindow);
    Menu.setApplicationMenu(appMenu);
    // log('Application menu initialized');
}
