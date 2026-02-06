/**
 * URL utility functions
 */

export function isMessengerUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        console.log('Parsed URL:', parsedUrl.hostname);
        return parsedUrl.hostname === 'messenger.com';
    } catch (error) {
        return false;
    }
}

export function isFacebookUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        console.log('Parsed URL:', parsedUrl.hostname);
        return parsedUrl.hostname === 'facebook.com';
    } catch (error) {
        return false;
    }
}
