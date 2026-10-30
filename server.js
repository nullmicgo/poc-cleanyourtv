const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4317;
const WEB = path.join(__dirname, "web");

const PACKAGES = [
  { id: "com.google.android.apps.tv.launcherx", label: "Google TV stock home", home: true },
  { id: "com.google.android.tungsten.setupwraith", label: "Setup wizard", home: true },
  { id: "com.google.android.gms", label: "Google Play services", keep: true },
  { id: "com.android.vending", label: "Play Store", keep: true },
  { id: "com.google.android.youtube.tv", label: "YouTube", keep: true },
  { id: "com.google.android.tv.ads", label: "Ads service", telemetry: true },
  { id: "com.google.android.apps.youtube.tv.recommendations", label: "Recommendation rows", telemetry: true },
  { id: "com.tcl.tvrecommendation", label: "TCL recommendation row", telemetry: true },
  { id: "com.google.android.tvlauncher.crashreporter", label: "Crash reporter", telemetry: true },
  { id: "com.netflix.mediaclient", label: "Netflix", keep: true },
];

function parseList(text) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function plan(listIds) {
  const byId = new Map(PACKAGES.map((p) => [p.id, p]));
  const steps = [];
  for (const id of listIds) {
    const pkg = byId.get(id);
    if (!pkg) {
      steps.push({ id, action: "skip", why: "not installed in the sample TV" });
    } else if (pkg.keep && !pkg.home) {
      steps.push({ id, action: "skip", why: "on the keep list" });
    } else if (pkg.home && pkg.id !== "com.google.android.apps.tv.launcherx") {
      steps.push({ id, action: "skip", why: "answers HOME, protected until a new launcher owns it" });
    } else {
      steps.push({ id, action: "disable", why: pkg.home ? "stock home, only after the new launcher is Home" : "bloat" });
    }
  }
  const disabled = steps.filter((s) => s.action === "disable").length;
  return { listIds, steps, disabled };
}

const SAMPLES = {};
for (const f of fs.readdirSync(path.join(WEB, "lists"))) {
  SAMPLES[f.replace(/\.txt$/, "")] = fs.readFileSync(path.join(WEB, "lists", f), "utf8");
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/packages") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(PACKAGES));
    }
    if (url.pathname === "/api/lists") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(Object.keys(SAMPLES)));
    }
    if (url.pathname === "/api/plan") {
      const name = url.searchParams.get("list") || Object.keys(SAMPLES)[0];
      if (!SAMPLES[name]) {
        res.writeHead(404, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "no such list" }));
      }
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(plan(parseList(SAMPLES[name]))));
    }
    if (url.pathname === "/api/custom" && req.method === "POST") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(plan(parseList(body))));
      });
      return;
    }
    const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const full = path.join(WEB, file);
    if (!full.startsWith(WEB) || !fs.existsSync(full)) {
      res.writeHead(404);
      return res.end("not found");
    }
    const ext = path.extname(full);
    const type = ext === ".html" ? "text/html; charset=utf-8" : ext === ".json" ? "application/json" : "text/plain; charset=utf-8";
    res.writeHead(200, { "content-type": type });
    res.end(fs.readFileSync(full));
  })
  .listen(PORT, () => console.log(`CleanYourTV POC on http://localhost:${PORT}`));
