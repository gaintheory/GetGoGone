'use client';

import React from 'react';
import { Icon } from './icons';
import { GGG } from './data';
import { UI } from './ui';
import { Dashboard } from './screens/dashboard';
import { Inventory } from './screens/inventory';
import { VehicleDetail } from './screens/vehicle-detail';
import { CampaignPackage } from './screens/campaign-package';
import { CreativeBuilder } from './screens/creative-builder';
import { Creatives } from './screens/creatives';
import { Leads } from './screens/leads';
import { TestDrive } from './screens/test-drive';
import { Marketing } from './screens/marketing';
import { Reports } from './screens/reports';
import { Settings } from './screens/settings';
import { AgencyCockpit } from './screens/agency-cockpit';
import { BrandBrain } from './screens/brand-brain';
import { AiLibrary } from './screens/ai-library';
import { VideoStudio } from './screens/video-studio';
import { channelModules } from '../features/campaigns/channel-modules';

function App() {
  const toastTimer = React.useRef(null);
  const [route, setRoute] = React.useState({ screen: "agency", id: null });
  const [toast, setToast] = React.useState(null);
  const [importDrawer, setImportDrawer] = React.useState(false);
  const [vehicles, setVehicles] = React.useState(GGG.VEHICLES);
  const [inventorySource, setInventorySource] = React.useState("Demo data");
  const [clients, setClients] = React.useState([]);
  const [activeClientId, setActiveClientId] = React.useState("agency_overview");
  const [aiStatus, setAiStatus] = React.useState(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const activeClient = clients.find(client => client.id === activeClientId) || null;

  const nav = (screen, id = null) => setRoute({ screen, id });
  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  React.useEffect(() => {
    let active = true;

    fetch("/api/agency/clients")
      .then((res) => res.json())
      .then((payload) => {
        if (!active || !payload?.ok) return;
        const nextClients = payload.clients || [];
        setClients(nextClients);
        const stored = window.localStorage?.getItem("getgogone.activeClientId");
        const nextClientId = stored && nextClients.some(client => client.id === stored)
          ? stored
          : nextClients[0]?.id || "agency_overview";
        setActiveClientId(nextClientId);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    const loadAiStatus = () => {
      fetch("/api/ai/status")
        .then(res => res.json())
        .then(payload => {
          if (active && payload?.ok) setAiStatus(payload.status);
        })
        .catch(() => {
          if (active) setAiStatus({ provider: "local", online: false, model: "unknown", error: "AI status unavailable" });
        });
    };
    loadAiStatus();
    const timer = window.setInterval(loadAiStatus, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    const clientIdParam = activeClientId && activeClientId !== "agency_overview"
      ? `clientId=${encodeURIComponent(activeClientId)}`
      : "";
    const params = [clientIdParam, "includeArchived=true"].filter(Boolean).join("&");
    const queryStr = params ? `?${params}` : "";

    fetch(`/api/inventory${queryStr}`)
      .then((res) => res.json())
      .then((payload) => {
        if (!active) return;
        if (payload?.vehicles?.length) {
          setVehicles(payload.vehicles);
          setInventorySource(payload.source || "Supabase inspections");
        } else if (payload?.configured === false) {
          setInventorySource("Demo data");
        } else {
          setVehicles([]);
          setInventorySource(payload?.source || "GetGoGone vehicles");
        }
      })
      .catch(() => {
        if (active) setInventorySource("Demo data");
      });

    return () => {
      active = false;
    };
  }, [activeClientId, refreshKey]);

  const changeClient = (clientId) => {
    setActiveClientId(clientId);
    window.localStorage?.setItem("getgogone.activeClientId", clientId);
    if (route.screen === "campaignReview") nav("campaigns");
  };

  const navItems = [
    { id: "agency", label: "Agency", icon: Icon.Chart },
    { id: "cockpit", label: "Cockpit", icon: Icon.CheckCircle },
    { id: "brandBrain", label: "Brand Brain", icon: Icon.Sparkles },
    { id: "aiLibrary", label: "AI Library", icon: Icon.FileText },
    { id: "dashboard", label: "Dashboard", icon: Icon.Home },
    { id: "inventory", label: "Inventory", icon: Icon.Car, count: vehicles.length },
    { id: "campaigns", label: "Campaigns", icon: Icon.Megaphone },
    { id: "packageBuilder", label: "Package Builder", icon: Icon.Folder },
    { id: "designer", label: "Designer", icon: Icon.Sparkles },
    { id: "videoStudio", label: "Video Studio", icon: Icon.Video },
    { id: "creatives", label: "Creatives", icon: Icon.Image },
    { id: "leads", label: "Leads", icon: Icon.Inbox },
    { id: "testdrive", label: "Test Drive", icon: Icon.Mic },
    { id: "marketing", label: "Marketing", icon: Icon.Send },
    { id: "reports", label: "Reports", icon: Icon.Chart },
    { id: "settings", label: "Settings", icon: Icon.Settings },
  ];

  // Campaigns screen redirects to builder for the demo
  const screenMap = {
    agency: () => <AgencyDashboard clients={clients} activeClient={activeClient} vehicles={vehicles} nav={nav}/>,
    cockpit: () => <AgencyCockpit nav={nav} clientId={activeClientId} activeClient={activeClient} toast={showToast}/>,
    brandBrain: () => <BrandBrain clientId={activeClientId} activeClient={activeClient} toast={showToast}/>,
    aiLibrary: () => <AiLibrary clientId={activeClientId} activeClient={activeClient} toast={showToast} initialStatus={route.id?.status}/>,
    dashboard: () => <Dashboard nav={nav} clientId={activeClientId} toast={showToast}/>,
    inventory: () => <Inventory nav={nav} vehicles={vehicles} clientId={activeClientId} inventorySource={inventorySource} onReload={() => setRefreshKey(k => k + 1)} toast={showToast}/>,
    vehicle: () => <VehicleDetail vehicleId={route.id} nav={nav} vehicles={vehicles} toast={showToast} onReload={() => setRefreshKey(k => k + 1)}/>,
    builder: () => <CampaignPackage nav={nav} toast={showToast} vehicles={vehicles} clientId={activeClientId} routeState={typeof route.id === "object" ? route.id : { vehicleId: route.id, source: "builder_redirect" }}/>,
    packageBuilder: () => <CampaignPackage nav={nav} toast={showToast} vehicles={vehicles} clientId={activeClientId} routeState={route.id}/>,
    campaigns: () => <CampaignsList nav={nav} clientId={activeClientId}/>,
    campaignReview: () => <CampaignReview campaignId={route.id} nav={nav} toast={showToast} clientId={activeClientId}/>,
    creatives: () => <Creatives nav={nav} toast={showToast} vehicles={vehicles} clientId={activeClientId}/>,
    designer: () => <CreativeBuilder vehicleId={route.id} nav={nav} toast={showToast} vehicles={vehicles} clientId={activeClientId}/>,
    videoStudio: () => <VideoStudio nav={nav} toast={showToast} vehicles={vehicles} clientId={activeClientId}/>,
    leads: () => <Leads nav={nav} toast={showToast} clientId={activeClientId} vehicles={vehicles}/>,
    testdrive: () => <TestDrive nav={nav} toast={showToast} vehicles={vehicles}/>,
    marketing: () => <Marketing nav={nav} toast={showToast} vehicles={vehicles}/>,
    reports: () => <Reports nav={nav} clientId={activeClientId} toast={showToast}/>,
    settings: () => <Settings toast={showToast}/>,
  };

  const isFullBleed = ["leads", "designer", "testdrive"].includes(route.screen);

  const activeNav = route.screen === "vehicle" ? "inventory" :
                    route.screen === "builder" ? "campaigns" :
                    route.screen === "packageBuilder" ? "packageBuilder" :
                    route.screen === "campaignReview" ? "campaigns" :
                    route.screen;
  // expand nav to 8 items now


  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar" data-screen-label="Sidebar">
        <div className="brand">
          <div className="brand-mark">
            G<span className="dot"/>G
          </div>
          <div>
            <div className="brand-name">Get ↓ Go ↑ Gone →</div>
            <div className="brand-sub">Agency Command</div>
          </div>
        </div>
        <div style={{ padding: "0 12px 10px" }}>
          <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em", marginBottom: 5 }}>
            ACTIVE CLIENT
          </label>
          <select
            className="select"
            value={activeClientId}
            onChange={(e) => changeClient(e.target.value)}
            style={{ width: "100%", height: 34, fontSize: 12 }}
          >
            <option value="agency_overview">Agency overview</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        <nav className="nav">
          <div className="nav-section">Workspace</div>
          {navItems.filter(n => n.id !== "settings").map(n => {
            const I = n.icon;
            return (
              <button key={n.id} className={`nav-item ${activeNav === n.id ? "active" : ""}`} onClick={() => nav(n.id)}>
                <I size={15} className="ico"/>
                <span>{n.label}</span>
                {n.count != null && <span className="count">{n.count}</span>}
              </button>
            );
          })}
          <div className="nav-section">System</div>
          <button className={`nav-item ${activeNav === "settings" ? "active" : ""}`} onClick={() => nav("settings")}>
            <Icon.Settings size={15} className="ico"/>
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">RL</div>
          <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">Ray Lawson</div>
            <div className="user-role">Agency operator</div>
          </div>
          <button
            className="icon-btn"
            style={{ width: 26, height: 26 }}
            title="Log out"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } finally {
                window.location.href = "/login";
              }
            }}
          >
            <Icon.LogOut size={13}/>
          </button>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar" data-screen-label="Topbar">
        <div className="search">
          <Icon.Search size={13}/>
          <input placeholder="Search vehicles, leads, campaigns..."/>
          <span className="kbd">⌘K</span>
        </div>
        <div className="topbar-actions">
          <button className="btn" onClick={() => setImportDrawer(true)}>
            <Icon.Upload size={13}/> Import
          </button>
          <button className="btn primary" onClick={() => nav("packageBuilder")}>
            <Icon.Sparkles size={13}/> Generate Campaign
          </button>
          <AiStatusBadge status={aiStatus}/>
          <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }}/>
          <button className="icon-btn" title="Notifications"><Icon.Bell size={16}/><span className="badge"/></button>
          <button className="icon-btn" title="Help"><Icon.FileText size={16}/></button>
        </div>
      </header>

      {/* Main */}
      <main className="main" data-screen-label={route.screen} style={isFullBleed ? { padding: 0 } : undefined}>
        {(screenMap[route.screen] || screenMap.dashboard)()}
      </main>

      {/* Toast */}
      {toast && <div className="toast"><Icon.CheckCircle size={14}/> {toast}</div>}

      {/* Import drawer */}
      {importDrawer && <ImportDrawer onClose={() => setImportDrawer(false)} onDone={() => { setImportDrawer(false); showToast("Imported 3 vehicles"); }}/>}
    </div>
  );
}

function AiStatusBadge({ status }) {
  const online = !!status?.online;
  const modelCount = status?.models?.length;
  const label = !status ? "AI checking" : online ? `Local AI ${modelCount ? `(${modelCount})` : "online"}` : "Local AI offline";
  const title = online
    ? `${status.provider || "local"} · copywriter: ${status.taskModels?.copywriter || status.model || "model"}`
    : status?.error || "Start Ollama to enable local AI generation";

  return (
    <div title={title} style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      height: 30,
      padding: "0 9px",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      background: "var(--surface)",
      color: online ? "var(--success)" : "var(--text-2)",
      fontSize: 11.5,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: online ? "var(--success)" : "var(--danger)" }}/>
      {label}
    </div>
  );
}

function AgencyDashboard({ clients, activeClient, vehicles, nav }) {
  const { Btn, Pill } = UI;
  const clientCount = clients.length;
  const vehicleCount = vehicles.length;
  const selectedLabel = activeClient?.name || "All clients";

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Agency command</h1>
          <div className="sub">Operator view for {selectedLabel}</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.CheckCircle} onClick={() => nav("cockpit")}>Open cockpit</Btn>
          <Btn icon={Icon.Sparkles} onClick={() => nav("brandBrain")}>Brand Brain</Btn>
          <Btn icon={Icon.Car} onClick={() => nav("inventory")}>Review inventory</Btn>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("packageBuilder")}>Generate campaign</Btn>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <AgencyKpi label="Clients" value={clientCount} note="Active in this workspace"/>
        <AgencyKpi label="Vehicles" value={vehicleCount} note="Loaded for current client"/>
        <AgencyKpi label="Campaign queue" value="Live" note="Cockpit queue is active"/>
        <AgencyKpi label="AI toolbox" value="Planned" note="Local/cloud provider layer"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-h">
            <div style={{ fontWeight: 600 }}>Client workspace</div>
            <Pill tone={activeClient ? "green" : "blue"} dot>{selectedLabel}</Pill>
          </div>
          <div className="card-b col" style={{ gap: 8 }}>
            {clients.length === 0 && <div className="muted">No clients loaded yet.</div>}
            {clients.map(client => (
              <div key={client.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 10px" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{client.name}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{[client.city, client.state].filter(Boolean).join(", ") || client.website_url || "Client profile"}</div>
                </div>
                <Pill tone={client.id === activeClient?.id ? "blue" : "gray"}>{client.id === activeClient?.id ? "Active" : "Available"}</Pill>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div style={{ fontWeight: 600 }}>Build sequence</div>
            <Pill tone="amber">Phase 1</Pill>
          </div>
          <div className="card-b col" style={{ gap: 8 }}>
            {[
              "Client switcher and active client context",
              "Client-aware inventory, campaigns, and creatives",
              "Marketing cockpit queue",
              "Brand and compliance brain",
              "AI provider adapter",
            ].map((item, index) => (
              <div key={item} className="row" style={{ gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: index < 3 ? "var(--primary)" : "var(--gray-100)", color: index < 3 ? "#fff" : "var(--text-2)", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>{index + 1}</div>
                <div style={{ fontSize: 12.5 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgencyKpi({ label, value, note }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{note}</div>
    </div>
  );
}

function CampaignsList({ nav, clientId }) {
  const { Pill, Btn } = UI;
  const [campaigns, setCampaigns] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [viewMode, setViewMode] = React.useState("list"); // "list" | "calendar"
  const [calendarCursor, setCalendarCursor] = React.useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month is 0-indexed
  });
  const filters = ["all", "draft", "published", "paused", "archived"];

  React.useEffect(() => {
    let active = true;
    const params = clientId && clientId !== "agency_overview" ? `?clientId=${encodeURIComponent(clientId)}` : "";
    fetch(`/api/campaigns${params}`)
      .then(res => res.json())
      .then(payload => {
        if (!active) return;
        if (payload?.ok) {
          setCampaigns(payload.campaigns || []);
          setError(null);
        } else {
          setError(payload?.error || "Could not load campaigns");
        }
      })
      .catch(() => {
        if (active) setError("Could not load campaigns");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);

  // Build a {dayNum -> [{campaign, channel}]} map for the cursor month using only
  // real publishDueAt values stored on each channel's platform_payload.
  const getScheduledChannelsByDay = (year, month /* 0-indexed */) => {
    const schedule = {};
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;

    campaigns.forEach(c => {
      (c.channels || []).forEach(ch => {
        const due = ch.platform_payload?.publishDueAt;
        if (due && typeof due === "string" && due.startsWith(monthPrefix)) {
          const dayNum = parseInt(due.split("-")[2], 10);
          if (!isNaN(dayNum)) {
            if (!schedule[dayNum]) schedule[dayNum] = [];
            schedule[dayNum].push({ campaign: c, channel: ch });
          }
        }
      });
    });

    return schedule;
  };

  const renderCalendar = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const { year, month } = calendarCursor;
    const firstOfMonth = new Date(year, month, 1);
    const leadingBlanks = firstOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const scheduled = getScheduledChannelsByDay(year, month);
    const totalScheduled = Object.values(scheduled).reduce((sum, items) => sum + items.length, 0);

    const goPrevMonth = () => setCalendarCursor(c => {
      const d = new Date(c.year, c.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    const goNextMonth = () => setCalendarCursor(c => {
      const d = new Date(c.year, c.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    const goCurrentMonth = () => {
      const now = new Date();
      setCalendarCursor({ year: now.getFullYear(), month: now.getMonth() });
    };

    const headers = weekdays.map(day => (
      <div key={day} style={{
        textAlign: "center", fontWeight: 700, fontSize: 10.5, color: "#94a3b8",
        padding: "6px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        {day.toUpperCase()}
      </div>
    ));

    const days = [];

    for (let i = 0; i < leadingBlanks; i++) {
      days.push(<div key={`empty-${i}`} style={{ background: "rgba(15, 23, 42, 0.15)", border: "1px solid rgba(255,255,255,0.02)", minHeight: 90 }}/>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const items = scheduled[day] || [];
      days.push(
        <div key={`day-${day}`} style={{
          background: "rgba(30, 41, 59, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          minHeight: 90,
          padding: 6,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          position: "relative"
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{day}</span>

          <div style={{ display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", flex: 1 }}>
            {items.map(({ campaign, channel }, itemIdx) => {
              const module = channelModules.find(m => m.id === channel.channel);
              return (
                <div
                  key={itemIdx}
                  onClick={() => nav("campaignReview", campaign.id)}
                  style={{
                    background: module?.color || "#1e293b",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 4,
                    padding: "2px 4px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    opacity: 0.95,
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}
                  title={`${campaign.name} - ${module?.name || channel.channel}`}
                >
                  {(module?.shortName || channel.channel).toUpperCase()}: {campaign.name.split(" ")[0]}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const remaining = (leadingBlanks + daysInMonth) % 7;
    if (remaining > 0) {
      for (let i = 0; i < (7 - remaining); i++) {
        days.push(<div key={`empty-end-${i}`} style={{ background: "rgba(15, 23, 42, 0.15)", border: "1px solid rgba(255,255,255,0.02)", minHeight: 90 }}/>);
      }
    }

    const navBtnStyle = {
      background: "rgba(15,23,42,0.5)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "#94a3b8",
      borderRadius: 6,
      padding: "4px 10px",
      fontSize: 12,
      cursor: "pointer",
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#38bdf8" }}>
              📆 {monthNames[month].toUpperCase()} {year} MARKETING CALENDAR
            </h3>
            <span className="muted" style={{ fontSize: 11.5 }}>
              {totalScheduled === 0
                ? "No channels scheduled this month."
                : `${totalScheduled} scheduled item${totalScheduled === 1 ? "" : "s"}.`}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={goPrevMonth} style={navBtnStyle} title="Previous month">&larr;</button>
            <button onClick={goCurrentMonth} style={navBtnStyle} title="Jump to current month">Today</button>
            <button onClick={goNextMonth} style={navBtnStyle} title="Next month">&rarr;</button>
          </div>
        </div>
        {totalScheduled === 0 && (
          <div style={{
            padding: "8px 12px",
            background: "rgba(56, 189, 248, 0.06)",
            border: "1px solid rgba(56, 189, 248, 0.15)",
            color: "rgba(226, 232, 240, 0.7)",
            borderRadius: 8,
            fontSize: 11.5,
          }}>
            Set a publish due date on a campaign channel and it&apos;ll appear here. Use &laquo; &raquo; to browse other months.
          </div>
        )}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 4,
          background: "#1e293b",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 8,
          padding: 4
        }}>
          {headers}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Campaigns</h1>
          <div className="sub">{loading ? "Loading saved campaigns..." : `${campaigns.length} saved campaign${campaigns.length === 1 ? "" : "s"}`}</div>
        </div>
        <div className="page-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Segmented view switcher */}
          <div style={{
            display: "flex",
            background: "rgba(15,23,42,0.3)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: 3
          }}>
            <button
              onClick={() => setViewMode("list")}
              style={{
                border: "none", background: viewMode === "list" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: viewMode === "list" ? "#3b82f6" : "#94a3b8", padding: "6px 12px", borderRadius: 6, fontSize: 11.5,
                fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              List view
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              style={{
                border: "none", background: viewMode === "calendar" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: viewMode === "calendar" ? "#3b82f6" : "#94a3b8", padding: "6px 12px", borderRadius: 6, fontSize: 11.5,
                fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              Content Calendar
            </button>
          </div>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("packageBuilder")}>New campaign</Btn>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {filters.map(f => (
              <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : titleCase(f)}
                <span style={{ marginLeft: 4, color: filter === f ? "rgba(255,255,255,0.7)" : "var(--text-2)" }}>
                  {f === "all" ? campaigns.length : campaigns.filter(c => c.status === f).length}
                </span>
              </button>
            ))}
          </div>

          <div className="card">
            {error && <div className="card-b" style={{ color: "var(--danger)" }}>{error}</div>}
            {!error && !loading && filtered.length === 0 && (
              <div className="card-b" style={{ textAlign: "center", color: "var(--text-2)", padding: 38 }}>
                <Icon.Megaphone size={28} className="ico" style={{ opacity: 0.45, marginBottom: 8 }}/>
                <div>No saved campaigns yet.</div>
              </div>
            )}
            <table className="tbl">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Channels</th>
                  <th>Goal</th>
                  <th>Language</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => nav("campaignReview", c.id)} style={{ cursor: "pointer" }}>
                    <td>
                      <div className="row">
                        <CampaignVehicleMark/>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div className="muted mono" style={{ fontSize: 11 }}>{vehicleLine(c.vehicle)}</div>
                        </div>
                      </div>
                    </td>
                    <td><Pill tone={campaignTone(c.status)} dot>{titleCase(c.status)}</Pill></td>
                    <td>
                      <div className="row" style={{ gap: 3 }}>
                        {(c.channels || []).map(ch => <CampaignChannelDot key={ch.id} channelId={ch.channel}/>)}
                      </div>
                    </td>
                    <td className="muted">{titleCase(c.goal || "campaign")}</td>
                    <td className="muted">{languageLabel(c.language)}</td>
                    <td className="muted">{formatDate(c.created_at)}</td>
                    <td><button className="icon-btn" style={{ width: 26, height: 26 }} onClick={(e) => e.stopPropagation()}><Icon.More size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        renderCalendar()
      )}
    </div>
  );
}

function CampaignReview({ campaignId, nav, toast, clientId }) {
  const { Pill, Btn } = UI;
  const [campaign, setCampaign] = React.useState(null);
  const [creativeAssets, setCreativeAssets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const channels = campaign?.channels || [];
  const assets = campaign?.assets || [];
  const channelStats = campaignChannelStats(channels);
  const updateChannel = (updatedChannel) => {
    setCampaign(current => current ? ({
      ...current,
      channels: (current?.channels || []).map(channel => (
        channel.id === updatedChannel.id ? updatedChannel : channel
      )),
    }) : current);
  };
  const addAsset = (asset) => {
    setCampaign(current => current ? ({
      ...current,
      assets: [asset, ...(current.assets || [])],
    }) : current);
  };
  const removeAsset = (assetId) => {
    setCampaign(current => current ? ({
      ...current,
      assets: (current.assets || []).filter(asset => asset.id !== assetId),
    }) : current);
  };

  React.useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ id: campaignId });
    if (clientId && clientId !== "agency_overview") params.set("clientId", clientId);
    fetch(`/api/campaigns?${params.toString()}`)
      .then(res => res.json())
      .then(payload => {
        if (!active) return;
        if (payload?.ok) {
          setCampaign(payload.campaign);
          setError(null);
        } else {
          setError(payload?.error || "Could not load campaign");
        }
      })
      .catch(() => {
        if (active) setError("Could not load campaign");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [campaignId, clientId]);

  React.useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ category: "saved_creative" });
    if (clientId && clientId !== "agency_overview") params.set("clientId", clientId);
    fetch(`/api/creative-templates?${params.toString()}`)
      .then(res => res.json())
      .then(payload => {
        if (!active) return;
        setCreativeAssets(payload?.ok ? payload.templates || [] : []);
      })
      .catch(() => {
        if (active) setCreativeAssets([]);
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  if (loading) {
    return <div className="page"><div className="card"><div className="card-b">Loading campaign...</div></div></div>;
  }

  if (error || !campaign) {
    return (
      <div className="page">
        <div className="page-h">
          <div>
            <h1>Campaign not found</h1>
            <div className="sub">{error || "This campaign could not be loaded."}</div>
          </div>
          <Btn icon={Icon.ChevronLeft} onClick={() => nav("campaigns")}>Back to campaigns</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <button className="btn ghost sm" onClick={() => nav("campaigns")} style={{ marginBottom: 8, paddingLeft: 0 }}>
            <Icon.ChevronLeft size={12}/> Campaigns
          </button>
          <h1>{campaign.name}</h1>
          <div className="sub">
            {vehicleLine(campaign.vehicle)} · {channels.length} channel draft{channels.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Copy} onClick={() => copyCampaignText(campaign, toast)}>Copy package</Btn>
          <Btn icon={Icon.Download} onClick={() => exportCampaignPackage(campaign, toast, addAsset)}>Export</Btn>
          <Btn icon={Icon.Sparkles} variant="primary" onClick={() => nav("packageBuilder")}>New campaign</Btn>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <AgencyKpi label="Channels" value={channels.length} note="Included in package"/>
        <AgencyKpi label="Approved" value={channelStats.approved} note="Ready to export or publish"/>
        <AgencyKpi label="Exported" value={channelStats.exported} note="Package generated"/>
        <AgencyKpi label="Published" value={channelStats.published} note="Live or manually posted"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>
        <aside className="card">
          <div className="card-h">
            <div style={{ fontWeight: 600, fontSize: 13 }}>Campaign summary</div>
            <Pill tone={campaignTone(campaign.status)} dot>{titleCase(campaign.status)}</Pill>
          </div>
          <div className="card-b col" style={{ gap: 12 }}>
            <ReviewFact label="Goal" value={titleCase(campaign.goal || "Campaign")}/>
            <ReviewFact label="Language" value={languageLabel(campaign.language)}/>
            <ReviewFact label="Type" value={titleCase(campaign.campaign_type || "Channel builder")}/>
            <ReviewFact label="Created" value={formatDate(campaign.created_at)}/>
            <ReviewFact label="Vehicle" value={vehicleLine(campaign.vehicle)}/>
            <div>
              <div className="label">Publishing progress</div>
              <div className="col" style={{ gap: 5, marginTop: 6 }}>
                {[
                  ["Draft", channelStats.draft],
                  ["Approved", channelStats.approved],
                  ["Exported", channelStats.exported],
                  ["Published", channelStats.published],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span>{label}</span>
                    <span className="mono muted">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="label">Saved assets</div>
              <div className="col" style={{ gap: 5, marginTop: 5 }}>
                {assets.length === 0 && <div className="muted" style={{ fontSize: 11.5 }}>No assets saved yet</div>}
                {assets.slice(0, 6).map(asset => (
                  <div key={asset.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 7px" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600 }}>{asset.metadata?.fileName || titleCase(asset.asset_type)}</div>
                    <div className="muted" style={{ fontSize: 10.5 }}>{titleCase(asset.asset_type)} · {formatDate(asset.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="col" style={{ gap: 12 }}>
          {channels.map(channel => (
            <CampaignChannelReview
              key={channel.id}
              channel={channel}
              assets={assets.filter(asset => asset.campaign_channel_id === channel.id)}
              creativeAssets={creativeAssets}
              toast={toast}
              onSaved={updateChannel}
              onAssetSaved={addAsset}
              onAssetRemoved={removeAsset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CampaignChannelReview({ channel, assets = [], creativeAssets = [], toast, onSaved, onAssetSaved, onAssetRemoved }) {
  const { Pill, Btn } = UI;
  const module = channelModules.find(item => item.id === channel.channel);
  const payload = channel.platform_payload || {};
  const outputs = payload.generatedOutputs || module?.generatedOutputs || [];
  const formats = payload.creativeFormats || module?.creativeFormats || [];
  const complianceNotes = payload.complianceNotes || module?.complianceNotes || [];
  const [headline, setHeadline] = React.useState(channel.headline || "");
  const [copy, setCopy] = React.useState(channel.primary_text || channel.description || "");
  const [cta, setCta] = React.useState(channel.call_to_action || "Check availability");
  const [setupText, setSetupText] = React.useState((payload.setupFields || module?.setupFields || []).join(", "));
  const [publishingMethod, setPublishingMethod] = React.useState(payload.publishingMethod || module?.publishingMethod || "Manual export");
  const [publishDueAt, setPublishDueAt] = React.useState(formatDateInput(payload.publishDueAt));
  const [ownerApprovalRequired, setOwnerApprovalRequired] = React.useState(payload.ownerApprovalRequired ?? isPaidChannel(channel.channel, module));
  const [ownerApproved, setOwnerApproved] = React.useState(Boolean(payload.ownerApproved));
  const [checklistNotes, setChecklistNotes] = React.useState(payload.checklistNotes || "");
  const [destinationUrl, setDestinationUrl] = React.useState(channel.destination_url || "");
  const [publishedUrl, setPublishedUrl] = React.useState(channel.published_url || "");
  const [assetLabel, setAssetLabel] = React.useState("");
  const [assetUrl, setAssetUrl] = React.useState("");
  const [selectedCreativeId, setSelectedCreativeId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    const nextPayload = channel.platform_payload || {};
    setHeadline(channel.headline || "");
    setCopy(channel.primary_text || channel.description || "");
    setCta(channel.call_to_action || "Check availability");
    setSetupText((nextPayload.setupFields || module?.setupFields || []).join(", "));
    setPublishingMethod(nextPayload.publishingMethod || module?.publishingMethod || "Manual export");
    setPublishDueAt(formatDateInput(nextPayload.publishDueAt));
    setOwnerApprovalRequired(nextPayload.ownerApprovalRequired ?? isPaidChannel(channel.channel, module));
    setOwnerApproved(Boolean(nextPayload.ownerApproved));
    setChecklistNotes(nextPayload.checklistNotes || "");
    setDestinationUrl(channel.destination_url || "");
    setPublishedUrl(channel.published_url || "");
  }, [channel, module]);

  const [publishing, setPublishing] = React.useState(false);

  const saveChannel = async (nextStatus = channel.status || "draft", statusToast = "Channel draft saved", customPublishedUrl = null) => {
    setSaving(true);
    try {
      const setupFields = setupText.split(",").map(item => item.trim()).filter(Boolean);
      const nextPayload = {
        ...payload,
        moduleName: payload.moduleName || module?.name || channel.channel,
        category: payload.category || module?.category || null,
        setupFields,
        generatedOutputs: outputs,
        creativeFormats: formats,
        publishingMethod,
        publishDueAt: publishDueAt || null,
        ownerApprovalRequired,
        ownerApproved,
        checklistNotes,
        complianceNotes,
      };
      const response = await fetch("/api/campaigns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          headline,
          primaryText: copy,
          callToAction: cta,
          destinationUrl,
          publishedUrl: customPublishedUrl !== null ? customPublishedUrl : publishedUrl,
          platformPayload: nextPayload,
          status: nextStatus,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Channel could not be saved");
      }

      onSaved(result.channel);
      toast(statusToast);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Channel could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const publishToGoogleBusiness = async () => {
    setPublishing(true);
    try {
      const response = await fetch("/api/publishing/google-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: channel.dealership_id,
          campaignId: channel.campaign_id,
          channelId: channel.id,
          headline,
          primaryText: copy,
          callToAction: cta,
          destinationUrl,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "GBP publishing simulation failed");
      
      setPublishedUrl(result.postUrl);
      await saveChannel("published", "Directly posted to Google Business Profile!", result.postUrl);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Direct publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const publishToMetaAds = async () => {
    setPublishing(true);
    try {
      const response = await fetch("/api/publishing/meta-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: channel.dealership_id,
          campaignId: channel.campaign_id,
          channelId: channel.id,
          adHeadline: headline,
          adBody: copy,
          campaignName: "Meta Paid Ads Campaign",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Meta Ads publishing simulation failed");
      
      setPublishedUrl(result.campaignUrl);
      await saveChannel("published", "Directly published Meta Campaign package!", result.campaignUrl);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Meta publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const publishToGoogleAds = async () => {
    setPublishing(true);
    try {
      const response = await fetch("/api/publishing/google-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: channel.dealership_id,
          campaignId: channel.campaign_id,
          channelId: channel.id,
          adHeadline: headline,
          adBody: copy,
          campaignName: "Google Ads Campaign",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Google Ads publishing simulation failed");
      
      setPublishedUrl(result.campaignUrl);
      await saveChannel("published", "Directly published Google Ads search package!", result.campaignUrl);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Google Ads publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  const attachAsset = async () => {
    if (!assetLabel.trim() && !assetUrl.trim()) {
      toast("Add an asset label or URL first");
      return;
    }
    try {
      const response = await fetch("/api/campaign-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: channel.campaign_id,
          campaignChannelId: channel.id,
          assetType: "creative_reference",
          format: assetUrl ? "url" : "note",
          fileUrl: assetUrl || null,
          metadata: {
            fileName: assetLabel || assetUrl,
            note: assetLabel,
            channel: channel.channel,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Asset could not be attached");
      onAssetSaved(result.asset);
      setAssetLabel("");
      setAssetUrl("");
      toast("Asset attached");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Asset could not be attached");
    }
  };

  const attachSavedCreative = async () => {
    const creative = creativeAssets.find(item => item.id === selectedCreativeId);
    if (!creative) {
      toast("Choose a saved creative first");
      return;
    }
    try {
      const canvas = creative.canvas_json || {};
      const response = await fetch("/api/campaign-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: channel.campaign_id,
          campaignChannelId: channel.id,
          assetType: "image_creative",
          format: creative.format || canvas.size?.id || "creative",
          templateId: creative.id,
          fileUrl: creative.preview_url || null,
          metadata: {
            fileName: creative.name,
            creativeName: creative.name,
            creativeId: creative.id,
            channel: channel.channel,
            format: creative.format || canvas.size?.id || "creative",
            vehicle: canvas.vehicle || null,
            editable: true,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Creative could not be attached");
      onAssetSaved(result.asset);
      setSelectedCreativeId("");
      toast("Creative attached");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Creative could not be attached");
    }
  };

  const detachAsset = async (asset) => {
    try {
      const response = await fetch(`/api/campaign-assets?id=${encodeURIComponent(asset.id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Asset could not be removed");
      onAssetRemoved?.(asset.id);
      toast("Asset removed");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Asset could not be removed");
    }
  };

  return (
    <div className="card">
      <div className="card-h">
        <div className="row">
          <CampaignChannelDot channelId={channel.channel}/>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{module?.name || channel.channel}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>{module?.category || payload.category || "Channel"}</div>
          </div>
        </div>
        <div className="row">
          <Pill tone={campaignTone(channel.status)} dot>{titleCase(channel.status)}</Pill>
          <Btn size="sm" icon={Icon.Copy} onClick={() => copyText([headline, copy].filter(Boolean).join("\n\n"), toast)}>Copy</Btn>
          <Btn size="sm" icon={Icon.Download} onClick={async () => {
            await exportChannelPackage(channel, { headline, copy, cta, setupText, publishingMethod, publishDueAt, ownerApprovalRequired, ownerApproved, checklistNotes, destinationUrl, publishedUrl }, toast, onAssetSaved);
            await saveChannel("exported", "Channel exported");
          }}>Export</Btn>
          {channel.channel === "google_business" && channel.status !== "published" && (
            <Btn size="sm" variant="primary" icon={Icon.Sparkles} onClick={publishToGoogleBusiness} disabled={publishing}>
              {publishing ? "Publishing..." : "⚡ Publish to GBP"}
            </Btn>
          )}
          {channel.channel === "meta_paid" && channel.status !== "published" && (
            <Btn size="sm" variant="primary" icon={Icon.Sparkles} onClick={publishToMetaAds} disabled={publishing}>
              {publishing ? "Publishing..." : "⚡ Direct Publish"}
            </Btn>
          )}
          {channel.channel === "google_ads" && channel.status !== "published" && (
            <Btn size="sm" variant="primary" icon={Icon.Sparkles} onClick={publishToGoogleAds} disabled={publishing}>
              {publishing ? "Publishing..." : "⚡ Direct Publish"}
            </Btn>
          )}
          <Btn size="sm" icon={Icon.CheckCircle} onClick={() => saveChannel("approved", "Channel approved")}>Approve</Btn>
          <Btn size="sm" icon={Icon.Send} onClick={() => saveChannel("published", "Channel marked published")}>Published</Btn>
          <Btn size="sm" variant="primary" icon={Icon.CheckCircle} onClick={() => saveChannel()}>{saving ? "Saving..." : "Save"}</Btn>
        </div>
      </div>
      <div className="card-b" style={{ display: "grid", gridTemplateColumns: "1fr 0.75fr", gap: 14 }}>
        <div className="col" style={{ gap: 8 }}>
          <div className="field">
            <label>Headline</label>
            <input className="input" value={headline} onChange={e => setHeadline(e.target.value)}/>
          </div>
          <div className="field">
            <label>Generated copy</label>
            <textarea className="input" value={copy} onChange={e => setCopy(e.target.value)} rows={7}/>
          </div>
          <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
            {complianceNotes.map(note => <Pill key={note} tone="amber">{note}</Pill>)}
          </div>
          
          {["craigslist", "facebook_organic", "instagram_organic", "short_video"].includes(channel.channel) && (
            <div style={{
              padding: 12,
              background: "rgba(30, 41, 59, 0.4)",
              border: "1px dashed rgba(255, 255, 255, 0.12)",
              borderRadius: 8,
              fontSize: 12,
              marginBottom: 4
            }}>
              <div style={{ fontWeight: 600, color: "#38bdf8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon.FileText size={13}/> Manual Posting Assistant (Checklist & Copy Tool)
              </div>
              <div className="col" style={{ gap: 6 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn size="xs" onClick={() => { copyText(headline, toast); }}>Copy Title</Btn>
                  <Btn size="xs" onClick={() => { copyText(copy, toast); }}>Copy Copywriting</Btn>
                  {destinationUrl && <Btn size="xs" onClick={() => { window.open(destinationUrl, "_blank"); }}>Open URL</Btn>}
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "4px 0" }}/>
                <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45 }}>
                  1. Press **Copy Title** and **Copy Copywriting** to load text buffers.<br/>
                  2. Press **Export** to download the vehicle image bundle.<br/>
                  3. Open the target platform (e.g. Craigslist/Groups) and paste details.<br/>
                  4. Paste your live post URL in the **Published URL** field to sync!
                </div>
              </div>
            </div>
          )}

          <PublishingChecklist
            channel={channel}
            setupFields={setupText.split(",").map(item => item.trim()).filter(Boolean)}
            outputs={outputs}
            formats={formats}
            publishDueAt={publishDueAt}
            ownerApprovalRequired={ownerApprovalRequired}
            ownerApproved={ownerApproved}
            assets={assets}
          />
        </div>
        <div className="col" style={{ gap: 9 }}>
          <div className="field">
            <label>Setup fields</label>
            <textarea className="input" value={setupText} onChange={e => setSetupText(e.target.value)} rows={3}/>
          </div>
          <div className="field">
            <label>CTA</label>
            <input className="input" value={cta} onChange={e => setCta(e.target.value)}/>
          </div>
          <div className="field">
            <label>Publishing path</label>
            <textarea className="input" value={publishingMethod} onChange={e => setPublishingMethod(e.target.value)} rows={3}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="field">
              <label>Publish due date</label>
              <input className="input" type="date" value={publishDueAt} onChange={e => setPublishDueAt(e.target.value)}/>
            </div>
            <div className="field">
              <label>Owner approval</label>
              <select className="select" value={ownerApprovalRequired ? (ownerApproved ? "approved" : "required") : "not_required"} onChange={e => {
                const value = e.target.value;
                setOwnerApprovalRequired(value !== "not_required");
                setOwnerApproved(value === "approved");
              }}>
                <option value="not_required">Not required</option>
                <option value="required">Required</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Checklist notes</label>
            <textarea className="input" value={checklistNotes} onChange={e => setChecklistNotes(e.target.value)} rows={2} placeholder="Budget approval, access notes, posting window, or platform-specific reminders"/>
          </div>
          <div className="field">
            <label>Destination URL</label>
            <input className="input" value={destinationUrl} onChange={e => setDestinationUrl(e.target.value)} placeholder="Landing page, lead form, or profile URL"/>
          </div>
          <div className="field">
            <label>Published URL / Post ID</label>
            <input className="input" value={publishedUrl} onChange={e => setPublishedUrl(e.target.value)} placeholder="Paste live URL or platform post ID"/>
          </div>
          <ReviewMini title="Outputs">{outputs.join(", ") || "No outputs saved"}</ReviewMini>
          <ReviewMini title="Formats">{formats.join(", ") || "No formats saved"}</ReviewMini>
          <ReviewMini title="Metrics">{(module?.metricFields || []).join(", ") || "Manual notes"}</ReviewMini>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 9px" }}>
            <div className="label" style={{ marginBottom: 6 }}>Attached assets</div>
            <div className="col" style={{ gap: 5, marginBottom: 8 }}>
              {assets.length === 0 && <div className="muted" style={{ fontSize: 11.5 }}>No channel assets attached</div>}
              {assets.slice(0, 6).map(asset => (
                <div key={asset.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "6px 7px", display: "grid", gridTemplateColumns: "1fr auto", gap: 6, alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {asset.metadata?.fileName || asset.metadata?.creativeName || titleCase(asset.asset_type)}
                    </div>
                    <div className="muted" style={{ fontSize: 10.5 }}>
                      {titleCase(asset.asset_type)} {asset.format ? `- ${asset.format}` : ""}
                    </div>
                  </div>
                  <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => detachAsset(asset)} title="Remove asset">
                    <Icon.Trash size={12}/>
                  </button>
                </div>
              ))}
            </div>
            <div className="field" style={{ marginBottom: 6 }}>
              <label>Saved creative</label>
              <select className="select" value={selectedCreativeId} onChange={e => setSelectedCreativeId(e.target.value)}>
                <option value="">Choose a saved creative</option>
                {creativeAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name} - {asset.format}</option>
                ))}
              </select>
              <button className="btn sm" style={{ marginTop: 6 }} onClick={attachSavedCreative}>
                <Icon.Image size={12}/> Attach saved creative
              </button>
            </div>
            <input className="input" value={assetLabel} onChange={e => setAssetLabel(e.target.value)} placeholder="Asset label or note" style={{ marginBottom: 6 }}/>
            <input className="input" value={assetUrl} onChange={e => setAssetUrl(e.target.value)} placeholder="Optional file/share URL"/>
            <button className="btn sm" style={{ marginTop: 6 }} onClick={attachAsset}><Icon.Link size={12}/> Attach URL/note</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampaignChannelDot({ channelId }) {
  const module = channelModules.find(item => item.id === channelId);
  return (
    <span title={module?.name || channelId} style={{ width: 22, height: 22, borderRadius: "var(--radius-sm)", background: module?.color || "#111827", color: "#fff", display: "grid", placeItems: "center", flex: "0 0 22px", fontSize: 10, fontWeight: 700 }}>
      {(module?.shortName || channelId || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

function PublishingChecklist({ channel, setupFields, outputs, formats, publishDueAt, ownerApprovalRequired, ownerApproved, assets = [] }) {
  const { Pill } = UI;
  const dueStatus = dueDateStatus(publishDueAt);
  const checklist = [
    ["Copy reviewed", Boolean(channel.headline || channel.primary_text || channel.description)],
    ["Setup fields ready", setupFields.length > 0],
    ["Expected outputs defined", outputs.length > 0],
    ["Creative format known", formats.length > 0],
    ["Channel asset attached", assets.length > 0],
    ["Publish date set", Boolean(publishDueAt)],
    ["Owner approval clear", !ownerApprovalRequired || ownerApproved],
    ["Export package saved", ["exported", "published"].includes(channel.status)],
    ["Live URL recorded", Boolean(channel.published_url)],
  ];

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 9px", background: "var(--gray-50)" }}>
      <div className="label" style={{ marginBottom: 6 }}>Channel readiness</div>
      {publishDueAt && (
        <div className="row" style={{ gap: 6, marginBottom: 6, fontSize: 11.5 }}>
          <Pill tone={dueStatus.tone}>{dueStatus.label}</Pill>
          <span className="muted">Due {formatDate(publishDueAt)}</span>
        </div>
      )}
      <div className="col" style={{ gap: 5 }}>
        {checklist.map(([label, done]) => (
          <div key={label} className="row" style={{ gap: 6, fontSize: 11.5 }}>
            {done ? <Icon.CheckCircle size={13} style={{ color: "var(--success)" }}/> : <Icon.AlertTriangle size={13} style={{ color: "var(--warning)" }}/>}
            <span className={done ? "" : "muted"}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function isPaidChannel(channelId, module) {
  const id = String(channelId || "");
  const category = String(module?.category || "").toLowerCase();
  return id.includes("paid") || id === "google_ads" || category.includes("paid");
}

function formatDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function dueDateStatus(value) {
  if (!value) return { label: "No due date", tone: "gray" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${value}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { label: "Overdue", tone: "red" };
  if (diffDays === 0) return { label: "Due today", tone: "amber" };
  if (diffDays <= 3) return { label: "Due soon", tone: "amber" };
  return { label: "Scheduled", tone: "blue" };
}

function CampaignVehicleMark() {
  return (
    <div style={{ width: 42, height: 32, borderRadius: "var(--radius-sm)", background: "var(--gray-100)", border: "1px solid var(--border)", display: "grid", placeItems: "center", color: "var(--text-2)" }}>
      <Icon.Car size={17}/>
    </div>
  );
}

function ReviewFact({ label, value }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div style={{ fontSize: 12.5, marginTop: 3 }}>{value || "Not set"}</div>
    </div>
  );
}

function ReviewMini({ title, children }) {
  return (
    <div>
      <div className="label">{title}</div>
      <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.45, marginTop: 3 }}>{children}</div>
    </div>
  );
}

function campaignTone(status) {
  if (status === "published") return "green";
  if (status === "exported") return "blue";
  if (status === "approved") return "green";
  if (status === "paused") return "amber";
  if (status === "archived") return "gray";
  return "blue";
}

function campaignChannelStats(channels) {
  return {
    draft: channels.filter(channel => !channel.status || channel.status === "draft").length,
    approved: channels.filter(channel => channel.status === "approved").length,
    exported: channels.filter(channel => channel.status === "exported").length,
    published: channels.filter(channel => channel.status === "published").length,
  };
}

function titleCase(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function languageLabel(value) {
  if (value === "both") return "English + Spanish";
  if (value === "es") return "Spanish";
  return "English";
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function vehicleLine(vehicle) {
  if (!vehicle) return "No vehicle linked";
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ") || vehicle.vin || "Vehicle";
}

function copyCampaignText(campaign, toast) {
  const text = (campaign.channels || []).map(ch => {
    const module = channelModules.find(item => item.id === ch.channel);
    return `${module?.name || ch.channel}\n${ch.headline || ""}\n${ch.primary_text || ch.description || ""}`.trim();
  }).join("\n\n---\n\n");
  copyText(text, toast);
}

function copyText(text, toast) {
  navigator.clipboard?.writeText(text || "").then(
    () => toast("Copied campaign text"),
    () => toast("Copy failed")
  );
}

async function exportCampaignPackage(campaign, toast, onAssetSaved) {
  const fileName = `${safeFileName(campaign.name)}-campaign-package.txt`;
  const text = [
    `Campaign: ${campaign.name}`,
    `Vehicle: ${vehicleLine(campaign.vehicle)}`,
    `Goal: ${titleCase(campaign.goal || "Campaign")}`,
    `Language: ${languageLabel(campaign.language)}`,
    `Status: ${titleCase(campaign.status)}`,
    "",
    "CHANNEL PACKAGES",
    "================",
    "",
    ...(campaign.channels || []).map(channel => buildChannelExportText(channel)),
  ].join("\n");

  downloadTextFile(fileName, text);
  await registerCampaignAsset({
    campaignId: campaign.id,
    assetType: "campaign_text_package",
    format: "txt",
    metadata: {
      fileName,
      campaignName: campaign.name,
      vehicle: vehicleLine(campaign.vehicle),
      channelCount: (campaign.channels || []).length,
      text,
    },
  }, toast, onAssetSaved);
}

async function exportChannelPackage(channel, draft, toast, onAssetSaved) {
  const text = buildChannelExportText(channel, draft);
  const module = channelModules.find(item => item.id === channel.channel);
  const fileName = `${safeFileName(module?.shortName || channel.channel)}-channel-package.txt`;
  downloadTextFile(fileName, text);
  await registerCampaignAsset({
    campaignId: channel.campaign_id,
    campaignChannelId: channel.id,
    assetType: "channel_text_package",
    format: "txt",
    metadata: {
      fileName,
      channel: channel.channel,
      moduleName: module?.name || channel.channel,
      text,
    },
  }, toast, onAssetSaved);
}

function buildChannelExportText(channel, draft = {}) {
  const module = channelModules.find(item => item.id === channel.channel);
  const payload = channel.platform_payload || {};
  const setupFields = draft.setupText
    ? draft.setupText.split(",").map(item => item.trim()).filter(Boolean)
    : payload.setupFields || module?.setupFields || [];
  const outputs = payload.generatedOutputs || module?.generatedOutputs || [];
  const formats = payload.creativeFormats || module?.creativeFormats || [];
  const complianceNotes = payload.complianceNotes || module?.complianceNotes || [];

  return [
    module?.name || channel.channel,
    "-".repeat((module?.name || channel.channel).length),
    `Status: ${titleCase(channel.status)}`,
    `CTA: ${draft.cta || channel.call_to_action || "Check availability"}`,
    `Publish due date: ${draft.publishDueAt || payload.publishDueAt || "Not set"}`,
    `Owner approval: ${ownerApprovalExportLabel(draft.ownerApprovalRequired ?? payload.ownerApprovalRequired, draft.ownerApproved ?? payload.ownerApproved)}`,
    `Destination URL: ${draft.destinationUrl || channel.destination_url || "Not set"}`,
    `Published URL/Post ID: ${draft.publishedUrl || channel.published_url || "Not set"}`,
    "",
    "Headline:",
    draft.headline || channel.headline || "",
    "",
    "Copy:",
    draft.copy || channel.primary_text || channel.description || "",
    "",
    "Setup Checklist:",
    ...setupFields.map(item => `- ${item}`),
    "",
    "Publishing Path:",
    draft.publishingMethod || payload.publishingMethod || module?.publishingMethod || "Manual export",
    "",
    "Checklist Notes:",
    draft.checklistNotes || payload.checklistNotes || "None",
    "",
    "Expected Outputs:",
    ...outputs.map(item => `- ${item}`),
    "",
    "Creative Formats:",
    ...formats.map(item => `- ${item}`),
    "",
    "Compliance Notes:",
    ...complianceNotes.map(item => `- ${item}`),
    "",
    "========================================",
    "",
  ].join("\n");
}

function ownerApprovalExportLabel(required, approved) {
  if (!required) return "Not required";
  return approved ? "Approved" : "Required before launch";
}

function downloadTextFile(fileName, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function registerCampaignAsset(asset, toast, onAssetSaved) {
  try {
    const response = await fetch("/api/campaign-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(asset),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || "Asset could not be saved");
    }

    onAssetSaved?.(result.asset);
    toast("Package downloaded and saved");
  } catch (error) {
    toast(error instanceof Error ? error.message : "Downloaded, but asset was not saved");
  }
}

function safeFileName(value) {
  return String(value || "getgogone")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "getgogone";
}

function ImportDrawer({ onClose, onDone }) {
  const { Btn } = UI;
  const [mode, setMode] = React.useState("csv");
  return (
    <>
      <div className="drawer-bg" onClick={onClose}/>
      <div className="drawer">
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 14 }}>Import inventory</h3>
          <button className="icon-btn" onClick={onClose}><Icon.X size={15}/></button>
        </div>
        <div style={{ padding: 16, flex: 1, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 16 }}>
            {[
              { id: "csv", label: "CSV file" },
              { id: "feed", label: "Website feed" },
              { id: "manual", label: "Add one" },
            ].map(m => (
              <button key={m.id} className={`chip ${mode === m.id ? "active" : ""}`} onClick={() => setMode(m.id)} style={{ justifyContent: "center", padding: "8px" }}>
                {m.label}
              </button>
            ))}
          </div>

          {mode === "csv" && (
            <>
              <div style={{ border: "2px dashed var(--border-strong)", borderRadius: "var(--radius)", padding: 30, textAlign: "center", color: "var(--text-2)", marginBottom: 14 }}>
                <Icon.Upload size={22} className="ico"/>
                <div style={{ marginTop: 8, fontWeight: 500, fontSize: 13 }}>Drop CSV file here</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>or <span style={{ color: "var(--primary)" }}>browse files</span></div>
              </div>
              <div style={{ background: "var(--gray-50)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 12, fontSize: 12, color: "var(--text-2)" }}>
                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>CSV format</div>
                <div className="mono" style={{ fontSize: 11 }}>stock_number, year, make, model, trim, mileage, price, down, weekly, vin, color</div>
                <button className="btn ghost sm" style={{ marginTop: 6, padding: 0, color: "var(--primary)" }}>Download template</button>
              </div>
            </>
          )}

          {mode === "feed" && (
            <div className="col" style={{ gap: 10 }}>
              <div className="field">
                <label>Feed URL</label>
                <input className="input mono" placeholder="https://yoursite.com/inventory.xml"/>
              </div>
              <div className="field">
                <label>Format</label>
                <select className="select"><option>vAuto XML</option><option>DealerCenter CSV</option><option>AutoManager</option><option>Custom XML</option></select>
              </div>
              <label className="checkbox"><input type="checkbox" defaultChecked/> Auto-sync every 4 hours</label>
            </div>
          )}

          {mode === "manual" && (
            <div className="col" style={{ gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div className="field"><label>Year</label><input className="input mono" placeholder="2018"/></div>
                <div className="field"><label>Make</label><input className="input" placeholder="Honda"/></div>
                <div className="field"><label>Model</label><input className="input" placeholder="Accord"/></div>
              </div>
              <div className="field"><label>Trim</label><input className="input" placeholder="EX-L"/></div>
              <div className="field"><label>VIN</label><input className="input mono" placeholder="17 chars"/></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <div className="field"><label>Price</label><input className="input mono" placeholder="$11,995"/></div>
                <div className="field"><label>Down</label><input className="input mono" placeholder="$1,500"/></div>
                <div className="field"><label>Weekly</label><input className="input mono" placeholder="$89"/></div>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={onDone}>Import</Btn>
        </div>
      </div>
    </>
  );
}

export default App;
