const ROUTE_PATTERNS: [RegExp, string][] = [
  [/^\/recipe\/[^/]+/, "/recipe/:id"],
  [/^\/inbox\/[^/]+/, "/inbox/:id"],
];

export function normalizePath(pathname: string): string {
  for (const [pattern, replacement] of ROUTE_PATTERNS) {
    if (pattern.test(pathname)) {
      return pathname.replace(pattern, replacement);
    }
  }
  return pathname;
}
