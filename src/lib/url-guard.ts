// Server-side fetches must not reach internal infrastructure. This blocks
// the hostname-level SSRF vectors: IP-literal private/reserved ranges,
// localhost aliases, and internal TLDs. It does not resolve DNS, so a public
// hostname pointing at a private IP is out of scope.

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "[::]", "[::1]"]);
const BLOCKED_TLDS = [".local", ".internal", ".localhost"];

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map(Number);
  if (octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    return false;
  }
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) // benchmarking
  );
}

function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.startsWith("[")) return false;
  const ip = hostname.slice(1, -1).toLowerCase();
  return (
    ip === "::1" ||
    ip === "::" ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") || // unique local fc00::/7
    ip.startsWith("fe8") ||
    ip.startsWith("fe9") ||
    ip.startsWith("fea") ||
    ip.startsWith("feb") || // link-local fe80::/10
    ip.startsWith("::ffff:") // v4-mapped — no legitimate use for page URLs
  );
}

export function isFetchableUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(url.protocol)) return false;

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) return false;
  if (BLOCKED_TLDS.some((tld) => hostname.endsWith(tld))) return false;
  if (!hostname.includes(".") && !hostname.startsWith("[")) return false;
  if (isPrivateIpv4(hostname)) return false;
  if (isPrivateIpv6(hostname)) return false;

  return true;
}
