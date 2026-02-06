import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { log } from '../utils/logger';

interface AppSettings {
    autoUpdate: boolean;
    autoStartup: boolean;
    startMinimized: boolean;
    minimizeToTray: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
    autoUpdate: true,
    autoStartup: false,
    startMinimized: false,
    minimizeToTray: true,
};

let cachedSettings: AppSettings | null = null;

function getSettingsPath(): string {
    return path.join(app.getPath('userData'), 'Config.json');
}

function isPortableVersion(): boolean {
    return !!process.env.PORTABLE_EXECUTABLE_DIR;
}

export function loadSettings(): AppSettings {
    if (cachedSettings) return cachedSettings;

    try {
        const settingsPath = getSettingsPath();
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf-8');
            cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
            log('Settings loaded from: ' + settingsPath);
        } else {
            cachedSettings = { ...DEFAULT_SETTINGS };
            saveSettings(cachedSettings);
        }
    } catch (error: any) {
        log('Failed to load settings: ' + error.message);
        cachedSettings = { ...DEFAULT_SETTINGS };
    }

    return cachedSettings as AppSettings;
}

export function saveSettings(settings: Partial<AppSettings>): void {
    try {
        const merged = { ...loadSettings(), ...settings };
        const settingsPath = getSettingsPath();
        fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2), 'utf-8');
        cachedSettings = merged;
        log('Settings saved');
    } catch (error: any) {
        log('Failed to save settings: ' + error.message);
    }
}

export function getSettings(): AppSettings {
    return loadSettings();
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    saveSettings({ [key]: value });
}

export function isPortable(): boolean {
    return isPortableVersion();
}
