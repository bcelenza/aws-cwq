export const unescapeValue = (v: string): string => {
    return v.replace(new RegExp('\\\\"', 'g'),'"')
        .replace(new RegExp('\\\\n', 'g'), '\n')
        .trim();
}