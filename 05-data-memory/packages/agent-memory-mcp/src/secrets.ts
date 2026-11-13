import { minimatch } from "./minimatch-lite.js";
import type { AllowlistEntry } from "./types.js";

export type SecretHit = { ruleId: string; category: string };

const RULES: Array<{ id: string; category: string; re: RegExp }> = [
  {
    id: "pem-private-key",
    category: "私钥 PEM",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    id: "aws-access-key",
    category: "AWS Access Key",
    re: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: "github-token",
    category: "GitHub Token",
    re: /\bghp_[A-Za-z0-9]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  },
  {
    id: "slack-token",
    category: "Slack Token",
    re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    id: "generic-bearer",
    category: "Bearer Token",
    re: /\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/,
  },
];

export function scanSecrets(
  text: string,
  opts: {
    allowlist: AllowlistEntry[];
    relativePath?: string;
  },
): SecretHit | null {
  const pathAllowed =
    opts.relativePath &&
    opts.allowlist.some(
      (a) => a.type === "path" && minimatch(opts.relativePath!, a.pattern),
    );
  if (pathAllowed) return null;

  for (const rule of RULES) {
    const ruleAllowed = opts.allowlist.some(
      (a) => a.type === "rule" && a.id === rule.id,
    );
    if (ruleAllowed) continue;
    if (rule.re.test(text)) {
      return { ruleId: rule.id, category: rule.category };
    }
  }
  return null;
}

export function listSecretRuleIds(): string[] {
  return RULES.map((r) => r.id);
}
