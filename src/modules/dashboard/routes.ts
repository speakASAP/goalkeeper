import { readFile } from "node:fs/promises";
import type { FastifyInstance, FastifyReply } from "fastify";

export interface DashboardRoadmapItem {
  goal: string;
  file: string;
  status: string;
  branch: string;
  dependsOn: string;
}

export interface DashboardState {
  generatedAt: string;
  currentStatus: {
    activeGoal: string;
    activeBranch: string;
    currentWave: string;
    completedGoals: string;
    runningGoals: string;
    blockedGoals: string;
    ipsMode: string;
    productionDeploymentStatus: string;
  };
  roadmap: DashboardRoadmapItem[];
  validationEvidence: string[];
  nextAction: string;
  commandSurface: string[];
}

const COMMAND_SURFACE = [
  "/status",
  "/projects",
  "/goals",
  "/tasks",
  "/blocked",
  "/overnight",
  "/agents",
  "/executors",
  "/task_log",
  "/deployment_readiness"
];

export function registerDashboardRoutes(app: FastifyInstance): void {
  app.get("/", async (_request, reply) => {
    return reply.redirect("/dashboard");
  });

  app.get("/dashboard", async (_request, reply) => {
    return sendHtml(reply, DASHBOARD_HTML);
  });

  app.get<{ Reply: DashboardState }>("/dashboard/state", async () => {
    const markdown = await readImplementationState();
    return buildDashboardState(markdown);
  });
}

export function buildDashboardState(markdown: string): DashboardState {
  return {
    generatedAt: new Date().toISOString(),
    currentStatus: {
      activeGoal: readBullet(markdown, "Active goal"),
      activeBranch: readBullet(markdown, "Active branch"),
      currentWave: readBullet(markdown, "Current wave"),
      completedGoals: readBullet(markdown, "Completed goals"),
      runningGoals: readBullet(markdown, "Running goals"),
      blockedGoals: readBullet(markdown, "Blocked goals"),
      ipsMode: readBullet(markdown, "IPS mode"),
      productionDeploymentStatus: readBullet(markdown, "Production deployment status")
    },
    roadmap: readRoadmap(markdown),
    validationEvidence: readValidationEvidence(markdown).slice(0, 6),
    nextAction: readNextAction(markdown),
    commandSurface: COMMAND_SURFACE
  };
}

async function readImplementationState(): Promise<string> {
  return readFile("docs/IMPLEMENTATION_STATE.md", "utf8");
}

function sendHtml(reply: FastifyReply, html: string): FastifyReply {
  return reply.type("text/html; charset=utf-8").send(html);
}

function readBullet(markdown: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^- ${escapedLabel}: (.+)$`, "m"));
  return stripBackticks(match?.[1]?.trim() ?? "not recorded");
}

function readRoadmap(markdown: string): DashboardRoadmapItem[] {
  const section = readSection(markdown, "Goal Roadmap");
  return section
    .split("\n")
    .filter((line) => line.startsWith("|") && !line.includes("---") && !line.includes("| Goal |"))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 5)
    .map(([goal, file, status, branch, dependsOn]) => ({
      goal,
      file: stripBackticks(file),
      status,
      branch: stripBackticks(branch),
      dependsOn
    }));
}

function readValidationEvidence(markdown: string): string[] {
  const section = readSection(markdown, "Validation Evidence Log");
  const fenced = section.match(/```text\n([\s\S]*?)```/);
  const source = fenced?.[1] ?? section;

  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d{4}-\d{2}-\d{2}:/.test(line));
}

function readNextAction(markdown: string): string {
  const section = readSection(markdown, "Next Action");
  return section
    .replace(/```[\s\S]*?```/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function readSection(markdown: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`## ${escapedHeading}\\n([\\s\\S]*?)(?=\\n## |$)`));
  return match?.[1] ?? "";
}

function stripBackticks(value: string): string {
  return value.replace(/`/g, "");
}

const DASHBOARD_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>GoalKeeper Orchestrator</title>
    <link rel="icon" href="data:,">
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7f8;
        --panel: #ffffff;
        --panel-soft: #fbfcfc;
        --text: #17201c;
        --muted: #65716b;
        --line: #dfe5e1;
        --line-strong: #cbd4cf;
        --green: #13795b;
        --green-soft: #e6f4ef;
        --amber: #a96800;
        --amber-soft: #fff3d7;
        --red: #b42318;
        --red-soft: #ffe9e6;
        --blue: #2c5f9f;
        --shadow: 0 12px 30px rgba(23, 32, 28, 0.06);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font: 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      button,
      code {
        font: inherit;
      }

      .shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 236px minmax(0, 1fr);
      }

      .rail {
        background: #ffffff;
        border-right: 1px solid var(--line);
        padding: 20px 14px;
        position: sticky;
        top: 0;
        height: 100vh;
      }

      .brand {
        padding: 4px 8px 22px;
      }

      .brand h1 {
        margin: 0;
        font-size: 20px;
        line-height: 1.1;
        letter-spacing: 0;
      }

      .brand p {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 12px;
      }

      .nav {
        display: grid;
        gap: 4px;
      }

      .nav a {
        display: flex;
        align-items: center;
        gap: 9px;
        min-height: 36px;
        padding: 8px 10px;
        border-radius: 8px;
        color: var(--muted);
        text-decoration: none;
        font-weight: 600;
        font-size: 13px;
      }

      .nav a[aria-current="page"],
      .nav a:hover {
        background: #eef4f1;
        color: var(--text);
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--line-strong);
        flex: 0 0 auto;
      }

      .dot.ok {
        background: var(--green);
      }

      .dot.warn {
        background: var(--amber);
      }

      .main {
        min-width: 0;
        padding: 22px 28px 34px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 18px;
      }

      .title h2 {
        margin: 0;
        font-size: 24px;
        letter-spacing: 0;
      }

      .title p {
        margin: 6px 0 0;
        color: var(--muted);
      }

      .status-strip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 12px;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: var(--shadow);
        color: var(--muted);
        white-space: nowrap;
      }

      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        gap: 16px;
        align-items: start;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        box-shadow: var(--shadow);
        min-width: 0;
      }

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 50px;
        padding: 13px 15px;
        border-bottom: 1px solid var(--line);
      }

      .panel-header h3 {
        margin: 0;
        font-size: 14px;
        letter-spacing: 0;
      }

      .panel-body {
        padding: 15px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }

      .metric {
        border: 1px solid var(--line);
        background: var(--panel-soft);
        border-radius: 8px;
        padding: 12px;
        min-height: 92px;
      }

      .metric span {
        color: var(--muted);
        display: block;
        font-size: 12px;
        margin-bottom: 8px;
      }

      .metric strong {
        display: block;
        font-size: 16px;
        line-height: 1.25;
      }

      .metric small {
        color: var(--muted);
        display: block;
        margin-top: 8px;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        border: 1px solid var(--line);
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 700;
        color: var(--muted);
      }

      .badge.ok {
        color: var(--green);
        border-color: #b9ded0;
        background: var(--green-soft);
      }

      .badge.warn {
        color: var(--amber);
        border-color: #f0d69b;
        background: var(--amber-soft);
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      .table th,
      .table td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--line);
        text-align: left;
        vertical-align: top;
      }

      .table th {
        color: var(--muted);
        font-size: 12px;
        font-weight: 700;
      }

      .table td {
        font-size: 13px;
      }

      .table tr:last-child td {
        border-bottom: 0;
      }

      .file {
        color: var(--muted);
        font-size: 12px;
      }

      .feed {
        display: grid;
        gap: 10px;
      }

      .feed-item {
        border-left: 3px solid var(--green);
        background: var(--panel-soft);
        border-radius: 0 8px 8px 0;
        padding: 10px 11px;
      }

      .feed-item time {
        display: block;
        color: var(--green);
        font-weight: 800;
        margin-bottom: 4px;
      }

      .feed-item p,
      .next-action {
        margin: 0;
        color: #3a443f;
      }

      .rail-list {
        display: grid;
        gap: 8px;
      }

      .rail-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--line);
        padding: 9px 0;
      }

      .rail-row:last-child {
        border-bottom: 0;
      }

      .rail-row span {
        color: var(--muted);
      }

      .commands {
        display: flex;
        flex-wrap: wrap;
        gap: 7px;
      }

      .command {
        border: 1px solid var(--line);
        background: var(--panel-soft);
        border-radius: 7px;
        color: var(--text);
        padding: 6px 8px;
        font-size: 12px;
      }

      .stack {
        display: grid;
        gap: 16px;
        align-content: start;
      }

      .loading {
        color: var(--muted);
      }

      @media (max-width: 1050px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .rail {
          position: static;
          height: auto;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        .nav {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .grid,
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 680px) {
        .main {
          padding: 18px 14px 28px;
        }

        .topbar {
          align-items: flex-start;
          flex-direction: column;
        }

        .status-strip {
          white-space: normal;
        }

        .nav {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .table {
          display: block;
          overflow-x: auto;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <aside class="rail">
        <div class="brand">
          <h1>GoalKeeper</h1>
          <p>Orchestrator audit surface</p>
        </div>
        <nav class="nav" aria-label="Dashboard sections">
          <a href="#overview" aria-current="page"><span class="dot ok"></span>Overview</a>
          <a href="#goals"><span class="dot"></span>Goals</a>
          <a href="#executors"><span class="dot"></span>Executors</a>
          <a href="#ips"><span class="dot"></span>IPS Gates</a>
          <a href="#deployment"><span class="dot warn"></span>Deployment</a>
        </nav>
      </aside>
      <main class="main">
        <header class="topbar">
          <div class="title">
            <h2>Orchestrator Overview</h2>
            <p>Live server health with repository implementation state.</p>
          </div>
          <div class="status-strip" id="server-status"><span class="dot warn"></span>Loading local server state</div>
        </header>

        <section class="grid" id="overview">
          <div class="stack">
            <section class="panel">
              <div class="panel-header">
                <h3>Current Status</h3>
                <span class="badge" id="ips-badge">IPS</span>
              </div>
              <div class="panel-body">
                <div class="summary-grid">
                  <div class="metric">
                    <span>Active goal</span>
                    <strong id="active-goal">Loading</strong>
                    <small id="running-goals"></small>
                  </div>
                  <div class="metric">
                    <span>Current wave</span>
                    <strong id="current-wave">Loading</strong>
                    <small id="active-branch"></small>
                  </div>
                  <div class="metric">
                    <span>Completed goals</span>
                    <strong id="completed-goals">Loading</strong>
                    <small>Roadmap progress</small>
                  </div>
                  <div class="metric">
                    <span>Blocked goals</span>
                    <strong id="blocked-goals">Loading</strong>
                    <small id="deployment-status"></small>
                  </div>
                </div>
              </div>
            </section>

            <section class="panel" id="goals">
              <div class="panel-header">
                <h3>Goal Roadmap</h3>
                <span class="badge ok" id="roadmap-count">0 recorded</span>
              </div>
              <div class="panel-body">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Goal</th>
                      <th>Status</th>
                      <th>Branch</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody id="roadmap-body">
                    <tr><td colspan="4" class="loading">Loading roadmap</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section class="panel" id="deployment">
              <div class="panel-header">
                <h3>Validation Evidence</h3>
                <span class="badge ok">Newest first</span>
              </div>
              <div class="panel-body">
                <div class="feed" id="validation-feed">
                  <div class="loading">Loading validation feed</div>
                </div>
              </div>
            </section>
          </div>

          <div class="stack">
            <section class="panel">
              <div class="panel-header">
                <h3>Next Action</h3>
                <span class="badge warn">Owner checkpoint</span>
              </div>
              <div class="panel-body">
                <p class="next-action" id="next-action">Loading next action</p>
              </div>
            </section>

            <section class="panel" id="executors">
              <div class="panel-header">
                <h3>Executor Readiness</h3>
                <span class="badge">Runtime view</span>
              </div>
              <div class="panel-body">
                <div class="rail-list">
                  <div class="rail-row"><span>CLI adapter</span><strong>Implemented</strong></div>
                  <div class="rail-row"><span>MCP adapter</span><strong>Interface ready</strong></div>
                  <div class="rail-row"><span>Worker threads</span><strong>None running</strong></div>
                  <div class="rail-row"><span>Autonomous execution</span><strong>IPS gated</strong></div>
                </div>
              </div>
            </section>

            <section class="panel" id="ips">
              <div class="panel-header">
                <h3>IPS Gates</h3>
                <span class="badge ok">Fail closed</span>
              </div>
              <div class="panel-body">
                <div class="rail-list">
                  <div class="rail-row"><span>Raw intent</span><strong>Required</strong></div>
                  <div class="rail-row"><span>Approved plan</span><strong>Required</strong></div>
                  <div class="rail-row"><span>Context package</span><strong>Required</strong></div>
                  <div class="rail-row"><span>Coding prompt</span><strong>Required</strong></div>
                  <div class="rail-row"><span>Validation report</span><strong>Required</strong></div>
                </div>
              </div>
            </section>

            <section class="panel">
              <div class="panel-header">
                <h3>Telegram Command Surface</h3>
                <span class="badge">Available</span>
              </div>
              <div class="panel-body">
                <div class="commands" id="commands"></div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>

    <script>
      const text = (id, value) => {
        document.getElementById(id).textContent = value || "not recorded";
      };

      const statusBadgeClass = (status) => {
        if (status === "done" || status.includes("complete")) return "badge ok";
        if (status === "blocked") return "badge warn";
        return "badge";
      };

      async function loadDashboard() {
        const [healthResponse, stateResponse] = await Promise.all([
          fetch("/health"),
          fetch("/dashboard/state")
        ]);
        const health = await healthResponse.json();
        const state = await stateResponse.json();
        const current = state.currentStatus;

        document.getElementById("server-status").innerHTML = '<span class="dot ok"></span>' +
          health.service + " " + health.status + " at " + new Date(health.timestamp).toLocaleTimeString();

        text("active-goal", current.activeGoal);
        text("running-goals", "Running goals: " + current.runningGoals);
        text("current-wave", current.currentWave);
        text("active-branch", current.activeBranch);
        text("completed-goals", String(state.roadmap.filter((item) => item.status === "done").length) + " / " + state.roadmap.length);
        text("blocked-goals", current.blockedGoals);
        text("deployment-status", current.productionDeploymentStatus);
        text("ips-badge", current.ipsMode);
        text("next-action", state.nextAction);
        text("roadmap-count", state.roadmap.length + " goals");

        document.getElementById("roadmap-body").innerHTML = state.roadmap.map((item) =>
          '<tr>' +
            '<td><strong>' + escapeHtml(item.goal) + '</strong><div class="file">Depends on: ' + escapeHtml(item.dependsOn) + '</div></td>' +
            '<td><span class="' + statusBadgeClass(item.status) + '">' + escapeHtml(item.status) + '</span></td>' +
            '<td>' + escapeHtml(item.branch) + '</td>' +
            '<td class="file">' + escapeHtml(item.file) + '</td>' +
          '</tr>'
        ).join("");

        document.getElementById("validation-feed").innerHTML = state.validationEvidence.map((entry) => {
          const parts = entry.split(": ");
          const date = parts.shift();
          return '<article class="feed-item"><time>' + escapeHtml(date) + '</time><p>' + escapeHtml(parts.join(": ")) + '</p></article>';
        }).join("");

        document.getElementById("commands").innerHTML = state.commandSurface.map((command) =>
          '<code class="command">' + escapeHtml(command) + '</code>'
        ).join("");
      }

      function escapeHtml(value) {
        return String(value)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      loadDashboard().catch((error) => {
        document.getElementById("server-status").innerHTML = '<span class="dot warn"></span>Dashboard failed to load';
        document.getElementById("next-action").textContent = error.message;
      });
    </script>
  </body>
</html>`;
