/**
 * URL utility functions
 */

export function isMessengerUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.pathname.includes('/share/'))
            return false;

        return parsedUrl.hostname === 'messenger.com' || parsedUrl.hostname === 'www.messenger.com';
    } catch (error) {
        return false;
    }
}

export function isFacebookUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        if (parsedUrl.pathname.includes('/share/'))
            return false;
            
        return parsedUrl.hostname === 'facebook.com' || parsedUrl.hostname === 'www.facebook.com';
    } catch (error) {
        return false;
    }
}
