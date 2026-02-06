import path from 'path';
import { WindowConfig } from '../types';
import { APP_TITLE } from './constants';

export const WINDOW_CONFIG: Record<string, WindowConfig> = {
    main: {
        width: 1400,
        height: 800,
        show: false,
        resizable: true,
        autoHideMenuBar: true,
        title: APP_TITLE,
        icon: path.join(__dirname, '../../assets/app.ico'),
    },
    splash: {
        width: 250,
        height: 250,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
    },
    external: {
        width: 1000,
        height: 800,
        autoHideMenuBar: true,
        title: APP_TITLE,
        icon: path.join(__dirname, '../../assets/app.ico'),
    },
    update: {
        width: 450,
        height: 200,
        resizable: false,
        frame: true,
        modal: true,
        title: 'Updating Messenger Desktop',
        show: false,
        icon: path.join(__dirname, '../../assets/app.ico'),
    },
};

export const WEB_PREFERENCES = {
    contextIsolation: true,
    nodeIntegration: false,
    partition: 'persist:messenger',
};
