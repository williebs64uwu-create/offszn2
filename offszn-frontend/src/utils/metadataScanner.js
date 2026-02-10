/**
 * Metadata Scanner Utility
 * ------------------------
 * Pure functions to extract BPM, Key, and Tags from text strings.
 * Refactored from the original youtube-importer.js logic.
 */

/**
 * Detects BPM in a string.
 * Looks for specific "BPM" labels or lone numbers in the common range (70-180).
 */
export const detectBPM = (text) => {
    if (!text) return null;
    const numericBPM = [];

    // 1. Look for explicit pattern: "120 BPM" or "120bpm"
    const explicitRegex = /\b(\d{2,3})\s?BPM\b/gi;
    let match;
    while ((match = explicitRegex.exec(text)) !== null) {
        const val = parseInt(match[1]);
        if (val >= 60 && val <= 250) numericBPM.push(val);
    }

    if (numericBPM.length > 0) return numericBPM[0];

    // 2. Fallback: Look for lone numbers 70-180
    const fallbackRegex = /\b(7[0-9]|8[0-9]|9[0-9]|1[0-7][0-9])\b/g;
    while ((match = fallbackRegex.exec(text)) !== null) {
        return parseInt(match[1]);
    }

    return null;
};

/**
 * Detects Musical Key in a string.
 * Normalizes to standard format (e.g., "C# Minor").
 */
export const detectKey = (text) => {
    if (!text) return null;

    const root = "[A-G]";
    const acc = "(?:#|b|flat|sharp)?";
    const scale = "(?:maj|major|mayor|M|min|minor|menor|m)";

    const regex = new RegExp(`\\b(${root})(${acc})\\s?(${scale})\\b`, 'gi');

    const match = regex.exec(text);
    if (!match) return null;

    let [, r, a, s] = match;

    // Normalize Root
    r = r.toUpperCase();

    // Normalize Accidental
    a = a ? a.toLowerCase() : '';
    if (a === 'flat') a = 'b';
    if (a === 'sharp') a = '#';

    // Normalize Scale
    s = s.toLowerCase();
    let type = 'Major';
    if (['min', 'minor', 'menor', 'm'].includes(s)) {
        type = 'Minor';
    }

    return `${r}${a} ${type}`;
};

/**
 * Detects tags in a string or array of strings.
 * Combines detected elements into a list.
 */
export const extractTags = (title, description, youtubeTags = []) => {
    const tags = new Set(youtubeTags);

    // Add logic here if we want to extract hashtags from description
    const hashtagRegex = /#(\w+)/g;
    let match;
    while ((match = hashtagRegex.exec(description)) !== null) {
        tags.add(match[1]);
    }

    return Array.from(tags).slice(0, 8); // Marketplace limit is 8
};

/**
 * Clean a title by removing common YouTube patterns like "[BUY 1 GET 2]"
 */
export const cleanTitle = (title) => {
    if (!title) return '';
    return title
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/FREE\s+/gi, '')
        .replace(/\s+BEAT\s+/gi, ' ')
        .trim();
};
