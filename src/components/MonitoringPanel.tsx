import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { Activity, Copy, RefreshCw, Search } from "lucide-react";
import { STATUS_COLORS } from "./constants";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

interface MonitoringEvent {
  id: string;
  type: string;
  result: string;
  email: string | null;
  actor: string | null;
  detail: Record<string, unknown> | null;
  source: "server" | "client";
  ip: string | null;
  userAgent: string | null;
  at: number | null;
}

interface DailyStats {
  day: string;
  counts: Record<string, number>;
  activeUsers: number;
}

interface Overview {
  daily: DailyStats[];
  activeUsers: number;
  returningUsers: number;
  funnel: { signedIn: number; openedApplication: number; submitted: number };
}

interface UserActivity {
  email: string;
  events: MonitoringEvent[];
  account: { createdAt: number; lastSignInAt: number | null } | null;
  application: { appStatus: string; submittedAt: number | null } | null;
}

interface Dropoff {
  email: string;
  lastOpenedAt: number | null;
  lastSeenAt: number | null;
  failedSubmits: number;
}

const EVENT_LABELS: Record<string, string> = {
  sign_in: "Sign in",
  sign_out: "Sign out",
  dashboard_opened: "Opened dashboard",
  application_opened: "Opened application",
  application_closed: "Left application",
  submit: "Submit application",
  edit: "Edit application",
  decision: "RSVP decision",
  withdraw: "Withdraw",
  status_change: "Status changed by admin",
  settings_change: "Settings changed",
};

const sumCounts = (counts: Record<string, number>, match: (key: string) => boolean) =>
  Object.entries(counts).reduce((sum, [key, value]) => (match(key) ? sum + value : sum), 0);

const isFailedSubmit = (key: string) => key.startsWith("submit:") && key !== "submit:success";

const METRICS: { key: string; label: string; value: (d: DailyStats) => number }[] = [
  { key: "activeUsers", label: "Active users", value: d => d.activeUsers },
  { key: "signIns", label: "Sign-ins", value: d => d.counts["sign_in:success"] || 0 },
  { key: "started", label: "Applications started", value: d => d.counts["application_opened:new"] || 0 },
  { key: "submitted", label: "Submissions", value: d => d.counts["submit:success"] || 0 },
  { key: "failed", label: "Failed submits", value: d => sumCounts(d.counts, isFailedSubmit) },
];

const SERIES_COLOR = "#2a78d6";

const card: CSSProperties = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  minWidth: 0,
};

const control: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "6px",
  border: "2px solid #ddd",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
};

const button: CSSProperties = {
  ...control,
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  backgroundColor: "#BFC3F4",
  border: "none",
  fontWeight: "bold",
};

const cell: CSSProperties = { padding: "8px", textAlign: "left", verticalAlign: "top" };
const muted: CSSProperties = { color: "#666", fontSize: "13px" };
const linkButton: CSSProperties = { background: "none", border: "none", padding: 0, color: SERIES_COLOR, cursor: "pointer", textAlign: "left", font: "inherit" };

const formatTime = (ms: number | null) =>
  ms === null
    ? "—"
    : new Date(ms).toLocaleString("en-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });

const formatDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const formatDetail = (event: MonitoringEvent) => {
  const parts = Object.entries(event.detail || {}).map(([key, value]) =>
    `${key}: ${Array.isArray(value) ? value.join(", ") || "none" : String(value)}`
  );
  if (event.actor) parts.unshift(`by ${event.actor}`);
  return parts.join(" · ");
};

const resultColor = (result: string) => {
  if (result === "error" || result === "invalid" || result.startsWith("rejected")) return STATUS_COLORS.declined;
  if (result === "success" || result === "accepted") return STATUS_COLORS.accepted;
  return STATUS_COLORS.waiting;
};

const fetchMonitoring = async <T,>(params: Record<string, string>): Promise<T> => {
  const res = await fetch(`/api/monitoring?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

function StatTile({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <div style={card}>
      <div style={muted}>{label}</div>
      <div style={{ fontSize: "32px", fontWeight: "bold", margin: "4px 0" }}>{value}</div>
      <div style={muted}>{note}</div>
    </div>
  );
}

function EventTable({ events, showEmail, onSelectEmail }: {
  events: MonitoringEvent[];
  showEmail: boolean;
  onSelectEmail?: (email: string) => void;
}) {
  if (events.length === 0) {
    return <p style={muted}>No events found.</p>;
  }

  return (
    <div style={{ maxHeight: "420px", overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead style={{ position: "sticky", top: 0, backgroundColor: "white" }}>
          <tr style={{ borderBottom: "2px solid #e9ecef" }}>
            <th style={cell}>Time (Chicago)</th>
            {showEmail && <th style={cell}>User</th>}
            <th style={cell}>Event</th>
            <th style={cell}>Result</th>
            <th style={cell}>Details</th>
            <th style={cell}>Source</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id} style={{ borderBottom: "1px solid #e9ecef" }}>
              <td style={{ ...cell, whiteSpace: "nowrap" }}>{formatTime(event.at)}</td>
              {showEmail && (
                <td style={cell}>
                  {event.email && onSelectEmail
                    ? <button style={linkButton} onClick={() => onSelectEmail(event.email as string)}>{event.email}</button>
                    : event.email || event.actor || "—"}
                </td>
              )}
              <td style={cell}>{EVENT_LABELS[event.type] || event.type}</td>
              <td style={cell}>
                <span style={{ backgroundColor: resultColor(event.result), padding: "2px 8px", borderRadius: "10px", whiteSpace: "nowrap" }}>
                  {event.result}
                </span>
              </td>
              <td style={{ ...cell, ...muted }}>{formatDetail(event)}</td>
              <td style={{ ...cell, ...muted, whiteSpace: "nowrap" }} title={event.userAgent || undefined}>
                {event.source === "client" ? "client-reported" : "server"}
                {event.ip && <div>{event.ip}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MonitoringPanel() {
  const [days, setDays] = useState(14);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewError, setOverviewError] = useState("");
  const [metricKey, setMetricKey] = useState(METRICS[0].key);

  const [lookupEmail, setLookupEmail] = useState("");
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");
  const lookupRef = useRef<HTMLDivElement | null>(null);

  const [feedType, setFeedType] = useState("");
  const [feed, setFeed] = useState<MonitoringEvent[]>([]);
  const [feedCursor, setFeedCursor] = useState<number | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);

  const [dropoffs, setDropoffs] = useState<Dropoff[] | null>(null);
  const [dropoffsLoading, setDropoffsLoading] = useState(false);

  const loadOverview = async () => {
    setOverviewError("");
    try {
      setOverview(await fetchMonitoring<Overview>({ view: "overview", days: String(days) }));
    }
    catch (err) {
      setOverviewError(err instanceof Error ? err.message : "Failed to load overview");
    }
  };

  const loadFeed = async (reset: boolean) => {
    setFeedLoading(true);
    try {
      const params: Record<string, string> = { view: "feed" };
      if (feedType) params.type = feedType;
      if (!reset && feedCursor) params.before = String(feedCursor);
      const page = await fetchMonitoring<{ events: MonitoringEvent[]; nextCursor: number | null }>(params);
      setFeed(prev => (reset ? page.events : [...prev, ...page.events]));
      setFeedCursor(page.nextCursor);
    }
    catch (err) {
      console.error(err);
    }
    setFeedLoading(false);
  };

  const lookupUser = async (email: string) => {
    if (!email.trim()) return;
    setLookupEmail(email);
    setUserLoading(true);
    setUserError("");
    try {
      setUserActivity(await fetchMonitoring<UserActivity>({ view: "user", email }));
    }
    catch (err) {
      setUserActivity(null);
      setUserError(err instanceof Error ? err.message : "Lookup failed");
    }
    setUserLoading(false);
  };

  const selectUser = (email: string) => {
    lookupUser(email);
    lookupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadDropoffs = async () => {
    setDropoffsLoading(true);
    try {
      setDropoffs((await fetchMonitoring<{ users: Dropoff[] }>({ view: "dropoffs" })).users);
    }
    catch (err) {
      console.error(err);
    }
    setDropoffsLoading(false);
  };

  useEffect(() => { loadOverview(); }, [days]);
  useEffect(() => { loadFeed(true); }, [feedType]);

  const metric = METRICS.find(m => m.key === metricKey) || METRICS[0];
  const totals = overview && {
    submissions: overview.daily.reduce((sum, d) => sum + (d.counts["submit:success"] || 0), 0),
    failedSubmits: overview.daily.reduce((sum, d) => sum + sumCounts(d.counts, isFailedSubmit), 0),
  };

  const funnelSteps = overview ? [
    { label: "Signed in", value: overview.funnel.signedIn },
    { label: "Started application", value: overview.funnel.openedApplication },
    { label: "Submitted", value: overview.funnel.submitted },
  ] : [];
  const funnelMax = Math.max(1, ...funnelSteps.map(s => s.value));

  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    lookupUser(lookupEmail);
  };

  return (
    <section style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
          <Activity size={22} /> Activity Monitoring
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          <select style={control} value={days} onChange={e => setDays(Number(e.target.value))} aria-label="Date range">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button style={button} onClick={() => { loadOverview(); loadFeed(true); }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {overviewError && <p style={{ color: "#b00020" }}>Failed to load monitoring data: {overviewError}</p>}

      {overview && totals && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px" }}>
            <StatTile label="Active users" value={overview.activeUsers} note={`Last ${days} days`} />
            <StatTile label="Returning users" value={overview.returningUsers} note="Active on 2+ days" />
            <StatTile label="Submissions" value={totals.submissions} note={`Last ${days} days`} />
            <StatTile label="Failed submits" value={totals.failedSubmits} note="Closed, duplicate, invalid or error" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Application Funnel</h3>
              <p style={muted}>Unique users since tracking began</p>
              {funnelSteps.map((step, i) => (
                <div key={step.label} style={{ marginTop: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span>{step.label}</span>
                    <span>
                      <strong>{step.value}</strong>
                      {i > 0 && funnelSteps[0].value > 0 && (
                        <span style={muted}> · {Math.round((step.value / funnelSteps[0].value) * 100)}% of sign-ins</span>
                      )}
                    </span>
                  </div>
                  <div style={{ height: "10px", backgroundColor: "#eee", borderRadius: "4px", marginTop: "6px" }}>
                    <div style={{ width: `${(step.value / funnelMax) * 100}%`, height: "100%", backgroundColor: SERIES_COLOR, borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <h3 style={{ margin: 0 }}>Daily {metric.label}</h3>
                <select style={control} value={metricKey} onChange={e => setMetricKey(e.target.value)} aria-label="Metric">
                  {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>
              <Bar
                data={{
                  labels: overview.daily.map(d => formatDay(d.day)),
                  datasets: [{
                    label: metric.label,
                    data: overview.daily.map(metric.value),
                    backgroundColor: SERIES_COLOR,
                    borderRadius: 4,
                    borderSkipped: "start",
                    maxBarThickness: 24,
                  }],
                }}
                options={{
                  responsive: true,
                  plugins: { tooltip: { intersect: false, mode: "index" } },
                  scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#eee" }, border: { display: false } },
                  },
                }}
              />
            </div>
          </div>
        </>
      )}

      <div style={card} ref={lookupRef}>
        <h3 style={{ marginTop: 0 }}>User Lookup</h3>
        <form onSubmit={handleLookup} style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "12px 0" }}>
          <input
            type="email"
            value={lookupEmail}
            onChange={e => setLookupEmail(e.target.value)}
            placeholder="netid@uic.edu"
            aria-label="User email"
            style={{ ...control, cursor: "text", flex: "1 1 240px" }}
          />
          <button type="submit" style={button} disabled={userLoading}>
            <Search size={16} /> {userLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {userError && <p style={{ color: "#b00020" }}>{userError}</p>}
        {userActivity && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px", fontSize: "14px" }}>
              <div><div style={muted}>Account created</div>{userActivity.account ? formatTime(userActivity.account.createdAt) : "No account"}</div>
              <div><div style={muted}>Last Firebase sign-in</div>{formatTime(userActivity.account?.lastSignInAt ?? null)}</div>
              <div>
                <div style={muted}>Application</div>
                {userActivity.application
                  ? <>{userActivity.application.appStatus} · submitted {formatTime(userActivity.application.submittedAt)}</>
                  : "Not submitted"}
              </div>
              <div><div style={muted}>Logged events</div>{userActivity.events.length}</div>
            </div>
            <EventTable events={userActivity.events} showEmail={false} />
          </>
        )}
      </div>

      <div style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
          <select style={control} value={feedType} onChange={e => setFeedType(e.target.value)} aria-label="Event type">
            <option value="">All events</option>
            {Object.entries(EVENT_LABELS).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
          </select>
        </div>
        <EventTable events={feed} showEmail onSelectEmail={selectUser} />
        {feedCursor && (
          <button style={{ ...button, marginTop: "12px" }} onClick={() => loadFeed(false)} disabled={feedLoading}>
            {feedLoading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>

      <div style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0 }}>Drop-offs</h3>
            <p style={muted}>Started an application but never submitted</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {dropoffs && dropoffs.length > 0 && (
              <button style={control} onClick={() => navigator.clipboard.writeText(dropoffs.map(d => d.email).join(", "))}>
                <Copy size={14} /> Copy emails
              </button>
            )}
            <button style={button} onClick={loadDropoffs} disabled={dropoffsLoading}>
              {dropoffsLoading ? "Loading..." : dropoffs ? "Reload" : "Load drop-offs"}
            </button>
          </div>
        </div>

        {dropoffs && (dropoffs.length === 0 ? <p style={muted}>No drop-offs.</p> : (
          <div style={{ maxHeight: "360px", overflow: "auto", marginTop: "12px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ position: "sticky", top: 0, backgroundColor: "white" }}>
                <tr style={{ borderBottom: "2px solid #e9ecef" }}>
                  <th style={cell}>User</th>
                  <th style={cell}>Last opened</th>
                  <th style={cell}>Last seen</th>
                  <th style={{ ...cell, textAlign: "right" }}>Failed submits</th>
                </tr>
              </thead>
              <tbody>
                {dropoffs.map(d => (
                  <tr key={d.email} style={{ borderBottom: "1px solid #e9ecef" }}>
                    <td style={cell}><button style={linkButton} onClick={() => selectUser(d.email)}>{d.email}</button></td>
                    <td style={cell}>{formatTime(d.lastOpenedAt)}</td>
                    <td style={cell}>{formatTime(d.lastSeenAt)}</td>
                    <td style={{ ...cell, textAlign: "right" }}>{d.failedSubmits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
