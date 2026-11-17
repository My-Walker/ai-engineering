"use strict";

const fs = require("fs");

function stripQuotes(s) {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function parseScalar(raw) {
  const v = String(raw).replace(/\r$/, "").trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+$/.test(v)) return Number(v);
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((x) => stripQuotes(x.trim()));
  }
  return stripQuotes(v);
}

/**
 * Minimal frontmatter parser for our schema (scalars + steps/inserts lists).
 * Normalizes CRLF so Windows-checked-in seed files parse reliably.
 */
function parseFrontmatter(text) {
  const normalized = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!normalized.startsWith("---")) {
    return { data: {}, body: text };
  }
  const end = normalized.indexOf("\n---", 3);
  if (end === -1) {
    return { data: {}, body: text };
  }
  const fm = normalized.slice(3, end).replace(/^\n/, "");
  const body = normalized.slice(end + 4).replace(/^\n/, "");
  const data = {};
  const lines = fm.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i += 1;
      continue;
    }
    if (line.trim() === "---") {
      break;
    }
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    const rest = m[2];
    if (rest === "" || rest === "|" || rest === ">") {
      // nested list block
      i += 1;
      if (key === "steps" || key === "inserts") {
        const items = [];
        while (i < lines.length) {
          const L = lines[i];
          if (/^[A-Za-z0-9_]+:/.test(L) && !/^\s/.test(L)) break;
          if (/^\s*-\s+use:\s*(.+)\s*$/.test(L) || /^\s*-\s+skill:\s*(.+)\s*$/.test(L)) {
            const useMatch = L.match(/^\s*-\s+use:\s*(.+)\s*$/);
            const skillMatch = L.match(/^\s*-\s+skill:\s*(.+)\s*$/);
            if (key === "inserts" && (skillMatch || (useMatch && useMatch[1].startsWith("skill:")))) {
              const ref = skillMatch
                ? `skill:${stripQuotes(skillMatch[1].trim())}`
                : stripQuotes(useMatch[1].trim());
              items.push(ref.startsWith("skill:") ? ref : `skill:${ref}`);
              i += 1;
              continue;
            }
            if (key === "steps" && useMatch) {
              const item = { use: stripQuotes(useMatch[1].trim()) };
              i += 1;
              while (i < lines.length && /^\s{2,}\w+:/.test(lines[i])) {
                const sm = lines[i].match(/^\s+(\w+):\s*(.*)$/);
                if (sm) {
                  const sk = sm[1];
                  const sv = parseScalar(sm[2]);
                  item[sk] = sv;
                }
                i += 1;
              }
              items.push(item);
              continue;
            }
          }
          if (/^\s*-\s+/.test(L) && key === "inserts") {
            const ref = stripQuotes(L.replace(/^\s*-\s+/, "").trim());
            items.push(ref.includes(":") ? ref : `skill:${ref}`);
            i += 1;
            continue;
          }
          if (!L.trim()) {
            i += 1;
            continue;
          }
          if (/^\s/.test(L)) {
            i += 1;
            continue;
          }
          break;
        }
        data[key] = items;
        continue;
      }
      i += 1;
      continue;
    }
    data[key] = parseScalar(rest);
    i += 1;
  }
  return { data, body };
}

function readDoc(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const { data, body } = parseFrontmatter(text);
  return { filePath, data, body, text };
}

function parseCommandsYaml(text) {
  const normalized = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const commands = [];
  const lines = normalized.split("\n");
  let current = null;
  for (const line of lines) {
    if (/^\s*-\s+skill:\s*(.+)\s*$/.test(line)) {
      if (current) commands.push(current);
      current = { skill: stripQuotes(line.match(/^\s*-\s+skill:\s*(.+)\s*$/)[1]) };
      continue;
    }
    if (current && /^\s+title:\s*(.+)\s*$/.test(line)) {
      current.title = stripQuotes(line.match(/^\s+title:\s*(.+)\s*$/)[1]);
    }
  }
  if (current) commands.push(current);
  return { commands };
}

module.exports = {
  parseFrontmatter,
  readDoc,
  parseCommandsYaml,
  stripQuotes,
};
