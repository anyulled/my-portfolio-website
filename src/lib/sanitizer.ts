export function sanitizeKey(key: string): string {
    return `${key
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 100)}.json`;
}