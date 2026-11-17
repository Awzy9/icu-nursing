// Temporary, narrowly-scoped exception for GHSA-fc5q-39xc-vjpf.
// Remove this script once a patched picomatch release is available.
// Never suppress another advisory, another vulnerable package, or an audit failure.
import { spawnSync } from "node:child_process";

const EXPIRES = "2026-12-01";
const ADVISORY = "GHSA-fc5q-39xc-vjpf";
const expected = new Set(["picomatch", "@parcel/watcher"]);
const today = new Date().toISOString().slice(0, 10);
if (today > EXPIRES) {
  console.error(`Security exception expired on ${EXPIRES}; reassess ${ADVISORY}.`);
  process.exit(1);
}

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const audit = spawnSync(command, ["audit", "--omit=dev", "--audit-level=high", "--json"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
  shell: process.platform === "win32"
});
if (audit.error || (audit.status !== 0 && audit.status !== 1)) {
  console.error("Production audit could not complete:", audit.error ?? audit.stderr);
  process.exit(1);
}
let report;
try { report = JSON.parse(audit.stdout); }
catch { console.error("Production audit returned invalid JSON:", audit.stderr); process.exit(1); }
if (report.error || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
  console.error("Production audit report is incomplete:", report.error ?? "missing vulnerabilities/metadata");
  process.exit(1);
}

const serious = Object.entries(report.vulnerabilities).filter(([, item]) =>
  item.severity === "high" || item.severity === "critical"
);
if (serious.length === 0 && audit.status === 0) {
  console.log("Production audit passed: no high or critical advisories.");
  process.exit(0);
}
const actual = new Set(serious.map(([name]) => name));
const pico = report.vulnerabilities.picomatch;
const watcher = report.vulnerabilities["@parcel/watcher"];
const picoAdvisories = pico?.via?.filter((item) => typeof item === "object") ?? [];
const onlyAdvisory = picoAdvisories.length === 1 &&
  (picoAdvisories[0].url?.includes(ADVISORY) || picoAdvisories[0].name === ADVISORY);
const onlyWatcherChain = watcher?.via?.length === 1 && watcher.via[0] === "picomatch";
const counts = report.metadata.vulnerabilities;
const countsMatch = counts.critical === 0 && counts.high === 2;
const exactPackages = actual.size === expected.size && [...actual].every((x) => expected.has(x));

if (audit.status === 1 && exactPackages && onlyAdvisory && onlyWatcherChain && countsMatch) {
  console.warn(`TEMPORARY SECURITY EXCEPTION (expires ${EXPIRES}): ${ADVISORY}`);
  console.warn("Only picomatch and @parcel/watcher are excepted; see docs/security/picomatch-exception.md.");
  process.exit(0);
}
console.error("Production audit failed: unexpected high/critical vulnerability or altered advisory chain.");
console.error(serious.map(([name, item]) => `${name}: ${item.severity}`).join("\n"));
process.exit(1);
