import { Menu, MenuItem, BrowserWindow, app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { APP_VERSION, APP_REPOSITORY } from '../config/constants';
import { log } from '../utils/logger';
import { getSettings, setSetting, isPortable } from '../managers/settings';

export function createAppMenu(mainWindow: BrowserWindow | null): Menu {
    const settings = getSettings();
    const isPortableVersion = isPortable();
    const isDevMode = !app.isPackaged;
    const canAutoStartup = !isPortableVersion && !isDevMode;
    
    const template: (MenuItem | {})[] = [
        {
            label: 'Application',
            submenu: [
                {
                    label: 'Auto Update',
                    type: 'checkbox',
                    checked: canAutoStartup ? settings.autoUpdate : false,
                    enabled: canAutoStartup,
                    click: (menuItem: MenuItem) => {
                        setSetting('autoUpdate', menuItem.checked);
                        autoUpdater.autoDownload = menuItem.checked;
                        autoUpdater.autoInstallOnAppQuit = menuItem.checked;
                        log('Auto update: ' + (menuItem.checked ? 'enabled' : 'disabled'));
                    }
                },
                {
                    label: 'Check for Updates...',
                    click: () => {
                        if (!canAutoStartup) {
                            dialog.showMessageBox(mainWindow!, {
                                type: 'info',
                                title: 'Updates Not Available',
                                message: 'Automatic updates are not available in portable or development mode.',
                                detail: 'Please visit our repository for the latest version.',
                                buttons: ['Cancel', 'Open Repository']
                            }).then(result => {
                                if (result.response === 1) {
                                    require('electron').shell.openExternal(APP_REPOSITORY);
                                }
                            });
                        } else { 
                            autoUpdater.checkForUpdates().catch(err => {
                                log('Update check failed: ' + err.message);
                            });
                        }
                    }
                },
                {
                    label: 'Auto Start with Windows',
                    type: 'checkbox',
                    checked: canAutoStartup ? settings.autoStartup : false,
                    enabled: canAutoStartup,
                    click: (menuItem: MenuItem) => {
                        if (canAutoStartup) {
                            setSetting('autoStartup', menuItem.checked);
                            app.setLoginItemSettings({
                                openAtLogin: menuItem.checked,
                                openAsHidden: settings.startMinimized
                            });
                            log('Auto start: ' + (menuItem.checked ? 'enabled' : 'disabled'));
                        }
                    }
                },
                {
                    label: 'Start Minimized',
                    type: 'checkbox',
                    checked: settings.startMinimized,
                    click: (menuItem: MenuItem) => {
                        setSetting('startMinimized', menuItem.checked);
                        log('Start minimized: ' + (menuItem.checked ? 'enabled' : 'disabled'));
                    }
                },
                {
                    label: 'Minimize to Tray',
                    type: 'checkbox',
                    checked: settings.minimizeToTray,
                    click: (menuItem: MenuItem) => {
                        setSetting('minimizeToTray', menuItem.checked);
                        log('Minimize to tray: ' + (menuItem.checked ? 'enabled' : 'disabled'));
                    }
                },
                { type: 'separator' },
                {
                    label: 'Reset Cache',
                    click: () => {
                        dialog.showMessageBox(mainWindow!, {
                            type: 'warning',
                            title: 'Reset Cache',
                            message: 'Are you sure you want to clear all cache and cookies?',
                            detail: 'This will log you out and remove all stored data. The application will restart.',
                            buttons: ['Cancel', 'Clear']
                        }).then(result => {
                            if (result.response === 1) {
                                mainWindow!.webContents.session.clearCache()
                                    .then(() => {
                                        mainWindow!.webContents.session.clearStorageData({
                                            storages: ['cookies', 'localstorage', 'indexdb']
                                        });
                                    })
                                    .then(() => {
                                        log('Cache and cookies cleared - restarting...');
                                        app.relaunch();
                                        app.exit(0);
                                    })
                                    .catch(err => {
                                        log('Failed to clear cache: ' + err.message);
                                        dialog.showErrorBox('Error', 'Failed to clear cache: ' + err.message);
                                    });
                            }
                        });
                    }
                },
                { type: 'separator' },
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
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow!, {
                            type: 'info',
                            title: 'About Messenger',
                            message: 'Messenger Desktop',
                            detail: 'A desktop application for Messenger\n\nCreated by: Komjáti János ("Xenius")\nEmail: xeniusnow@gmail.com\n\nVersion: ' + APP_VERSION,
                            buttons: ['Close']
                        });
                    }
                },
                {
                    label: 'Open Repository',
                    click: () => {
                        require('electron').shell.openExternal(APP_REPOSITORY);
                    }
                }
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
