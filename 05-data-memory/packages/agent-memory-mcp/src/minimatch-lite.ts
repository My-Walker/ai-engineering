/** Minimal glob: * and ** support for allowlist paths. */
export function minimatch(path: string, pattern: string): boolean {
  const norm = path.replace(/\\/g, "/");
  const pat = pattern.replace(/\\/g, "/");
  if (pat.includes("**")) {
    const parts = pat.split("**").map(escapeRegexExceptStar);
    const re = new RegExp("^" + parts.join(".*") + "$");
    return re.test(norm);
  }
  const re = new RegExp(
    "^" +
      pat
        .split("*")
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*") +
      "$",
  );
  return re.test(norm);
}

function escapeRegexExceptStar(s: string): string {
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
}
