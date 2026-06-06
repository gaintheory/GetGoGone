import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { assessVehicleReadiness } from '../../features/inventory/readiness';

function Inventory({ nav, vehicles: providedVehicles, clientId, inventorySource = "Demo data", onReload, toast }) {
  const { VEHICLES, fmt$, fmtMi, statusPill } = GGG;
  const { Pill, Btn, VehicleThumb } = UI;
  
  const inputStyle = {
    background: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    padding: "8px 10px",
    color: "#fff",
    outline: "none",
    fontSize: "12.5px"
  };
  
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(new Set());
  
  // ZIP Intake UI state
  const [showZipModal, setShowZipModal] = React.useState(false);
  const [folderPath, setFolderPath] = React.useState("");
  const [overwriteExisting, setOverwriteExisting] = React.useState(false);
  const [dryRun, setDryRun] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState(null);
  const [importError, setImportError] = React.useState(null);

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    setImportLogs([]);

    try {
      const res = await fetch("/api/inventory/import/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderPath,
          overwriteExisting,
          dryRun,
          dealershipId: clientId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to run ZIP import.");
      }
      setImportResult(data);
      if (onReload && !dryRun) {
        onReload();
      }
    } catch (err) {
      setImportError(err.message || String(err));
    } finally {
      setImporting(false);
    }
  };

  // CSV Intake UI state
  const [showCsvModal, setShowCsvModal] = React.useState(false);
  const [csvText, setCsvText] = React.useState("");
  const [csvName, setCsvName] = React.useState("");
  const [csvHeaders, setCsvHeaders] = React.useState([]);
  const [previewRows, setPreviewRows] = React.useState([]);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [customMapping, setCustomMapping] = React.useState({});
  const [csvStep, setCsvStep] = React.useState(1); // 1 = select, 2 = map, 3 = loading, 4 = results
  const [overwriteCsv, setOverwriteCsv] = React.useState(false);
  const [dryRunCsv, setDryRunCsv] = React.useState(false);
  const [importingCsv, setImportingCsv] = React.useState(false);
  const [csvResult, setCsvResult] = React.useState(null);
  const [csvError, setCsvError] = React.useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvName(file.name);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result;
      if (typeof text === "string") {
        setCsvText(text);
        analyzeCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const analyzeCsv = async (text) => {
    setImportingCsv(true);
    setCsvError(null);
    try {
      const dealershipId = clientId && clientId !== "agency_overview" ? clientId : "";
      const savedRes = await fetch(`/api/inventory/import/csv?clientId=${dealershipId}`);
      const savedData = await savedRes.json();
      
      const res = await fetch("/api/inventory/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse CSV.");
      
      setCsvHeaders(data.headers);
      setPreviewRows(data.previewRows);
      setTotalRecords(data.totalRecordsDetected);
      
      const baseMapping = savedData.mapping || data.suggestedMapping || {};
      const initialMap = {};
      const fields = [
        "vin", "stockNumber", "year", "make", "model", "trim", "bodyStyle",
        "mileage", "exteriorColor", "interiorColor", "price", "downPayment",
        "transmission", "drivetrain", "engine", "fuelType", "description", "photoUrls"
      ];
      fields.forEach(f => {
        initialMap[f] = baseMapping[f] || "";
      });
      
      setCustomMapping(initialMap);
      setCsvStep(2);
    } catch (err) {
      setCsvError(err.message || String(err));
    } finally {
      setImportingCsv(false);
    }
  };

  const handleCsvImport = async () => {
    setImportingCsv(true);
    setCsvError(null);
    setCsvStep(3);
    setImportLogs([]);

    try {
      const dealershipId = clientId && clientId !== "agency_overview" ? clientId : "";
      const res = await fetch("/api/inventory/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvText,
          fieldMapping: customMapping,
          dealershipId,
          overwriteExisting: overwriteCsv,
          dryRun: dryRunCsv,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "CSV import pipeline failed.");

      setCsvResult(data);
      setCsvStep(4);
      if (onReload && !dryRunCsv) {
        onReload();
      }
    } catch (err) {
      setCsvError(err.message || String(err));
      setCsvStep(2);
    } finally {
      setImportingCsv(false);
    }
  };

  // Manual Add UI state
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [manualVin, setManualVin] = React.useState("");
  const [manualStock, setManualStock] = React.useState("");
  const [manualYear, setManualYear] = React.useState("");
  const [manualMake, setManualMake] = React.useState("");
  const [manualModel, setManualModel] = React.useState("");
  const [manualTrim, setManualTrim] = React.useState("");
  const [manualBody, setManualBody] = React.useState("");
  const [manualMileage, setManualMileage] = React.useState("");
  const [manualPrice, setManualPrice] = React.useState("");
  const [manualDown, setManualDown] = React.useState("");
  const [manualEngine, setManualEngine] = React.useState("");
  const [manualTrans, setManualTrans] = React.useState("");
  const [manualDrive, setManualDrive] = React.useState("");
  const [manualFuel, setManualFuel] = React.useState("");
  const [manualExtColor, setManualExtColor] = React.useState("");
  const [manualIntColor, setManualIntColor] = React.useState("");
  const [manualDesc, setManualDesc] = React.useState("");
  const [manualHistoryUrl, setManualHistoryUrl] = React.useState("");
  const [decodingVin, setDecodingVin] = React.useState(false);
  const [savingManual, setSavingManual] = React.useState(false);
  const [manualError, setManualError] = React.useState(null);
  const [manualSuccessMsg, setManualSuccessMsg] = React.useState(null);

  const handleQuickDecode = async () => {
    if (!manualVin || manualVin.trim().length !== 17) {
      setManualError("Please enter a valid 17-character VIN.");
      return;
    }
    setDecodingVin(true);
    setManualError(null);
    setManualSuccessMsg(null);
    try {
      const res = await fetch(`/api/inventory/import/vin?vin=${encodeURIComponent(manualVin.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "NHTSA decode failed.");
      
      const specs = data.specs || {};
      if (specs.year) setManualYear(String(specs.year));
      if (specs.make) setManualMake(specs.make);
      if (specs.model) setManualModel(specs.model);
      if (specs.trim) setManualTrim(specs.trim);
      if (specs.bodyStyle) setManualBody(specs.bodyStyle);
      if (specs.engine) setManualEngine(specs.engine);
      if (specs.transmission) setManualTrans(specs.transmission);
      if (specs.drivetrain) setManualDrive(specs.drivetrain);
      if (specs.fuelType) setManualFuel(specs.fuelType);
      
      setManualSuccessMsg("VIN decoded successfully! Prefilled 9 specs.");
    } catch (err) {
      setManualError(err.message || String(err));
    } finally {
      setDecodingVin(false);
    }
  };

  const handleSaveManual = async () => {
    setSavingManual(true);
    setManualError(null);
    try {
      const dealershipId = clientId && clientId !== "agency_overview" ? clientId : "";
      const res = await fetch("/api/inventory/import/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealershipId,
          vehicle: {
            vin: manualVin,
            stockNumber: manualStock,
            year: manualYear,
            make: manualMake,
            model: manualModel,
            trim: manualTrim,
            bodyStyle: manualBody,
            mileage: manualMileage,
            price: manualPrice,
            downPayment: manualDown,
            engine: manualEngine,
            transmission: manualTrans,
            drivetrain: manualDrive,
            fuelType: manualFuel,
            exteriorColor: manualExtColor,
            interiorColor: manualIntColor,
            description: manualDesc,
            sourceUrl: manualHistoryUrl,
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Manual vehicle save failed.");
      
      setManualSuccessMsg("Vehicle created successfully!");
      if (onReload) {
        onReload();
      }
      setTimeout(() => {
        setShowAddModal(false);
        resetManualForm();
      }, 1500);
    } catch (err) {
      setManualError(err.message || String(err));
    } finally {
      setSavingManual(false);
    }
  };

  const resetManualForm = () => {
    setManualVin("");
    setManualStock("");
    setManualYear("");
    setManualMake("");
    setManualModel("");
    setManualTrim("");
    setManualBody("");
    setManualMileage("");
    setManualPrice("");
    setManualDown("");
    setManualEngine("");
    setManualTrans("");
    setManualDrive("");
    setManualFuel("");
    setManualExtColor("");
    setManualIntColor("");
    setManualDesc("");
    setManualHistoryUrl("");
    setManualError(null);
    setManualSuccessMsg(null);
  };

  const [activeDropdownId, setActiveDropdownId] = React.useState(null);

  React.useEffect(() => {
    const handleClose = () => setActiveDropdownId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  const archiveVehicle = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to archive this vehicle? It will be hidden from inventory and cockpit recommendations, but kept in database records.")) return;
    try {
      const response = await fetch(`/api/inventory?id=${vehicleId}&action=archive`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Archive failed");
      toast?.("Vehicle listing archived successfully!");
      onReload?.();
    } catch (err) {
      alert(`Could not archive vehicle: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const deleteVehicle = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to permanently delete this vehicle from the database? This action is irreversible.")) return;
    try {
      const response = await fetch(`/api/inventory?id=${vehicleId}&action=delete`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Delete failed");
      toast?.("Vehicle listing deleted permanently!");
      onReload?.();
    } catch (err) {
      alert(`Could not delete vehicle: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const vehicles = providedVehicles || [];
  const readinessById = React.useMemo(() => new Map(vehicles.map(v => [v.id, assessVehicleReadiness(v)])), [vehicles]);

  const filters = [
    { id: "all", label: "All", count: vehicles.filter(v => String(v.status).toLowerCase() !== "archived").length },
    { id: "active", label: "Active", count: vehicles.filter(v => v.status === "Active").length },
    { id: "advertised", label: "Advertised", count: vehicles.filter(v => v.status === "Advertised").length },
    { id: "attention", label: "Needs attention", count: vehicles.filter(v => String(v.status).toLowerCase() !== "archived" && readinessById.get(v.id)?.status !== "ready").length },
    { id: "aging", label: "Aging (30d+)", count: vehicles.filter(v => String(v.status).toLowerCase() !== "archived" && v.daysIn >= 30).length },
    { id: "archived", label: "Archived", count: vehicles.filter(v => String(v.status).toLowerCase() === "archived").length },
  ];

  const rows = vehicles.filter(v => {
    const isArchived = String(v.status).toLowerCase() === "archived";
    if (filter === "archived") {
      if (!isArchived) return false;
    } else {
      if (isArchived) return false;
      if (filter === "active" && v.status !== "Active") return false;
      if (filter === "advertised" && v.status !== "Advertised") return false;
      if (filter === "attention" && readinessById.get(v.id)?.status === "ready") return false;
      if (filter === "aging" && v.daysIn < 30) return false;
    }
    if (q && !(`${v.year} ${v.make} ${v.model} ${v.stock}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const toggle = (id) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Inventory</h1>
          <div className="sub">{vehicles.length} vehicles · {vehicles.filter(v => v.status === "Advertised").length} advertised · {vehicles.filter(v => ["Needs Photos","Missing Payment"].includes(v.status)).length} need attention · {inventorySource}</div>
        </div>
        <div className="page-actions">
          <Btn icon={Icon.Upload} onClick={() => setShowZipModal(true)}>Import ZIP Kit</Btn>
          <Btn icon={Icon.Upload} onClick={() => setShowCsvModal(true)}>Import CSV</Btn>
          <Btn icon={Icon.Link}>Sync from website</Btn>
          <Btn icon={Icon.Plus} variant="dark" onClick={() => setShowAddModal(true)}>Add vehicle</Btn>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div className="row" style={{ gap: 4 }}>
          {filters.map(f => (
            <button key={f.id} className={`chip ${filter === f.id ? "active" : ""}`} onClick={() => setFilter(f.id)}>
              {f.label}
              <span className="muted" style={{ marginLeft: 4, color: filter === f.id ? "rgba(255,255,255,0.7)" : undefined }}>{f.count}</span>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div className="search" style={{ flex: "0 0 240px", position: "relative" }}>
            <Icon.Search size={13} className="ico"/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by year, make, stock #..."/>
          </div>
          <Btn size="sm" icon={Icon.Filter}>More filters</Btn>
        </div>
      </div>

      {/* Bulk action bar */}
      {sel.size > 0 && (
        <div style={{ background: "#111827", color: "#fff", borderRadius: "var(--radius-lg)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 12.5 }}>{sel.size} selected</span>
          <button className="btn sm" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}>
            <Icon.Sparkles size={12}/> Generate campaigns
          </button>
          <button className="btn sm" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}>
            <Icon.Tag size={12}/> Update price
          </button>
          <button className="btn sm" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff" }}>
            <Icon.Download size={12}/> Export
          </button>
          <button onClick={() => setSel(new Set())} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>Clear</button>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: "center" }}>
          <Icon.Car size={36} className="ico" style={{ opacity: 0.4, marginBottom: 8 }}/>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>No vehicles in this client&apos;s inventory yet.</div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
            Import a CarsForSale ZIP kit, upload a CSV, or add a vehicle manually to get started.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <Btn icon={Icon.Upload} onClick={() => setShowZipModal(true)}>Import ZIP Kit</Btn>
            <Btn icon={Icon.Upload} onClick={() => setShowCsvModal(true)}>Import CSV</Btn>
            <Btn icon={Icon.Plus} variant="primary" onClick={() => setShowAddModal(true)}>Add vehicle</Btn>
          </div>
        </div>
      ) : (
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 30 }}>
                <input type="checkbox" checked={sel.size === rows.length && rows.length > 0}
                  onChange={() => sel.size === rows.length ? setSel(new Set()) : setSel(new Set(rows.map(r => r.id)))}/>
              </th>
              <th style={{ width: 290 }}>Vehicle</th>
              <th>Stock #</th>
              <th>Price</th>
              <th>Down / Wk</th>
              <th>Mileage</th>
              <th>Status</th>
              <th>Readiness</th>
              <th>Campaign</th>
              <th>Days</th>
              <th>Leads</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(v => (
              <tr key={v.id} className={sel.has(v.id) ? "selected" : ""}>
                {(() => {
                  const readiness = readinessById.get(v.id) || assessVehicleReadiness(v);
                  return (
                    <>
                <td onClick={(e) => { e.stopPropagation(); toggle(v.id); }}>
                  <input type="checkbox" checked={sel.has(v.id)} onChange={() => toggle(v.id)}/>
                </td>
                <td onClick={() => nav("vehicle", v.id)} style={{cursor:"pointer"}}>
                  <div className="row">
                    <VehicleThumb v={v}/>
                    <div>
                      <div style={{ fontWeight: 600 }}>{v.year} {v.make} {v.model}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{v.trim} · {v.color}</div>
                    </div>
                  </div>
                </td>
                <td><span className="mono muted">{v.stock}</span></td>
                <td className="mono" style={{ fontWeight: 600 }}>{fmt$(v.price)}</td>
                <td>
                  <div className="mono" style={{ fontWeight: 600 }}>{fmt$(v.down)} down</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{Number(v.weekly) > 0 ? `${fmt$(v.weekly)}/wk` : "terms pending"}</div>
                </td>
                <td className="mono muted">{fmtMi(v.mileage)}</td>
                <td><Pill tone={statusPill(v.status)} dot>{v.status}</Pill></td>
                <td>
                  <Pill tone={readinessTone(readiness.status)}>{readiness.score}</Pill>
                  <div className="muted" style={{ fontSize: 10.5, marginTop: 3, maxWidth: 150 }}>{readiness.summary}</div>
                </td>
                <td><Pill tone={statusPill(v.campaign)}>{v.campaign}</Pill></td>
                <td className="mono">{v.daysIn}d</td>
                <td>
                  <span className="mono" style={{ fontWeight: 600 }}>{v.leads}</span>
                </td>
                <td>
                  <div style={{ position: "relative" }}>
                    <button className="icon-btn" style={{ width: 26, height: 26 }} 
                      onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === v.id ? null : v.id); }}>
                      <Icon.More size={14}/>
                    </button>
                    {activeDropdownId === v.id && (
                      <div className="card" style={{
                        position: "absolute",
                        right: 0,
                        top: 30,
                        zIndex: 100,
                        width: 150,
                        padding: 4,
                        background: "rgba(15, 23, 42, 0.95)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
                        borderRadius: "var(--radius-sm)"
                      }} onClick={(e) => e.stopPropagation()}>
                        <button className="btn sm ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "6px 8px", fontSize: 11.5 }}
                          onClick={() => { setActiveDropdownId(null); nav("vehicle", v.id); }}>
                          <Icon.Eye size={12} style={{ marginRight: 6 }}/> View details
                        </button>
                        <button className="btn sm ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "6px 8px", fontSize: 11.5 }}
                          onClick={() => { setActiveDropdownId(null); nav("builder", v.id); }}>
                          <Icon.Sparkles size={12} style={{ marginRight: 6 }}/> Gen campaign
                        </button>
                        <div className="hr" style={{ margin: "4px 0" }}/>
                        <button className="btn sm ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "6px 8px", fontSize: 11.5, color: "var(--warning-700)" }}
                          onClick={() => { setActiveDropdownId(null); archiveVehicle(v.id); }}>
                          🗄️ Archive
                        </button>
                        <button className="btn sm ghost" style={{ width: "100%", justifyContent: "flex-start", padding: "6px 8px", fontSize: 11.5, color: "var(--danger)" }}
                          onClick={() => { setActiveDropdownId(null); deleteVehicle(v.id); }}>
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                    </>
                  );
                })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {vehicles.length > 0 && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, fontSize: 11.5 }} className="muted">
        <span>Showing {rows.length} of {vehicles.length} vehicles</span>
        <div className="row">
          <Btn size="sm" variant="ghost" icon={Icon.ChevronLeft}/>
          <span>Page 1 of 1</span>
          <Btn size="sm" variant="ghost" icon={Icon.ChevronRight}/>
        </div>
      </div>
      )}

      {/* ZIP Import Modal */}
      {showZipModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "#1e293b",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 580,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            color: "#fff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(to right, rgba(37, 99, 235, 0.1), transparent)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon.Upload size={18} style={{ color: "#3b82f6" }}/>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Import CarsForSale ZIP Kits</h3>
              </div>
              <button 
                onClick={() => {
                  if (!importing) {
                    setShowZipModal(false);
                    setImportResult(null);
                    setImportError(null);
                  }
                }}
                disabled={importing}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4
                }}
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: 24, fontSize: 13.5, lineHeight: 1.5 }}>
              {!importing && !importResult && !importError && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.7)" }}>
                    Bulk import vehicle listings directly from your CarsForSale exported ZIP kits. Each zip file contains the vehicle info sheet, specs details card, and lot photos.
                  </p>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Source Inventory Folder Path
                    </label>
                    <input 
                      type="text" 
                      value={folderPath} 
                      onChange={e => setFolderPath(e.target.value)}
                      placeholder="e.g. C:\\path\\to\\inventory"
                      style={{
                        background: "#0f172a",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: "#fff",
                        fontFamily: "monospace",
                        fontSize: 12.5,
                        outline: "none"
                      }}
                    />
                    <span style={{ fontSize: 11.5, color: "rgba(255, 255, 255, 0.4)" }}>
                      Absolute path on the server where CarsForSale ZIP kits are staged. Leave blank to use the project&apos;s <code>Inventory/</code> folder.
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={overwriteExisting} 
                        onChange={e => setOverwriteExisting(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>Overwrite Existing</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Update specs and photos for matching VINs</div>
                      </div>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={dryRun} 
                        onChange={e => setDryRun(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>Dry Run Preview</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Validate files without writing to database</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {importing && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 14 }}>
                  <div className="spinner" style={{
                    width: 36,
                    height: 36,
                    border: "3px solid rgba(59, 130, 246, 0.2)",
                    borderTop: "3px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}/>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Importing ZIP kits...</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 12, marginTop: 4 }}>
                      This can take a minute for large batches. Results will appear when the import finishes.
                    </div>
                  </div>
                </div>
              )}

              {importError && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: 8,
                    padding: 16,
                    color: "#f87171",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start"
                  }}>
                    <Icon.AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }}/>
                    <div>
                      <div style={{ fontWeight: 600 }}>Import failed</div>
                      <div style={{ fontSize: 12.5, marginTop: 4 }}>{importError}</div>
                    </div>
                  </div>
                </div>
              )}

              {importResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: 8,
                    padding: 14,
                    color: "#34d399",
                    display: "flex",
                    gap: 8,
                    alignItems: "center"
                  }}>
                    <Icon.CheckCircle size={18}/>
                    <div style={{ fontWeight: 600 }}>
                      {dryRun ? "Dry run inspection complete!" : "Inventory import completed successfully!"}
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                    background: "#0f172a",
                    borderRadius: 8,
                    padding: 14,
                    textAlign: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Total ZIPs</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#3b82f6" }}>
                        {importResult.pipelineResult?.totalRecords ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Inserted</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#10b981" }}>
                        {importResult.pipelineResult?.inserted ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Updated</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#f59e0b" }}>
                        {importResult.pipelineResult?.updated ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Failed</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#ef4444" }}>
                        {(importResult.pipelineResult?.errors ?? 0) + (importResult.parseErrors?.length ?? 0)}
                      </div>
                    </div>
                  </div>

                  {importResult.parseErrors && importResult.parseErrors.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#f87171" }}>File Parsing Errors:</div>
                      <div style={{
                        background: "#0f172a",
                        borderRadius: 6,
                        maxHeight: 120,
                        overflowY: "auto",
                        padding: 10,
                        fontSize: 11.5,
                        fontFamily: "monospace",
                        color: "#f87171"
                      }}>
                        {importResult.parseErrors.map((err, idx) => (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            <strong>{err.filename}</strong>: {err.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importResult.pipelineResult?.rows?.some(r => r.action === "error") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#f87171" }}>Database Pipeline Errors:</div>
                      <div style={{
                        background: "#0f172a",
                        borderRadius: 6,
                        maxHeight: 120,
                        overflowY: "auto",
                        padding: 10,
                        fontSize: 11.5,
                        fontFamily: "monospace",
                        color: "#f87171"
                      }}>
                        {importResult.pipelineResult.rows.filter(r => r.action === "error").map((row, idx) => (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            <strong>{row.year} {row.make} {row.model} (Stock# {row.stockNumber})</strong>: {row.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(15, 23, 42, 0.4)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12
            }}>
              {!importResult && !importError ? (
                <>
                  <Btn 
                    variant="ghost" 
                    onClick={() => setShowZipModal(false)}
                    disabled={importing}
                  >
                    Cancel
                  </Btn>
                  <Btn 
                    variant="primary" 
                    onClick={handleImport}
                    disabled={importing}
                    icon={Icon.Sparkles}
                  >
                    {importing ? "Importing..." : "Scan & Import"}
                  </Btn>
                </>
              ) : (
                <Btn 
                  variant="primary" 
                  onClick={() => {
                    setShowZipModal(false);
                    setImportResult(null);
                    setImportError(null);
                  }}
                >
                  Close Window
                </Btn>
              )}
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "#1e293b",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 680,
            maxHeight: "90vh",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            color: "#fff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon.Upload size={18} style={{ color: "#10b981" }}/>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Import Inventory from CSV</h3>
              </div>
              <button 
                onClick={() => {
                  if (csvStep !== 3) {
                    setShowCsvModal(false);
                    setCsvResult(null);
                    setCsvError(null);
                    setCsvStep(1);
                  }
                }}
                disabled={csvStep === 3}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4
                }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: 24, fontSize: 13, lineHeight: 1.5, overflowY: "auto", flex: 1 }}>
              
              {/* STEP 1: Select/Paste File */}
              {csvStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.7)" }}>
                    Upload any inventory CSV file exported from CDK, Reynolds & Reynolds, DealerSocket, or vAuto. GetGoGone will analyze the headers, suggest column mappings, and show you a preview before importing.
                  </p>

                  <div style={{
                    border: "2px dashed rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    padding: "36px 20px",
                    textAlign: "center",
                    cursor: "pointer",
                    position: "relative",
                    background: "rgba(15,23,42,0.2)",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = "#10b981"}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
                  >
                    <input 
                      type="file" 
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={importingCsv}
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0,
                        cursor: "pointer"
                      }}
                    />
                    <Icon.Upload size={28} style={{ color: "rgba(255,255,255,0.4)", marginBottom: 8 }}/>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {importingCsv ? "Analyzing CSV format..." : "Choose CSV File to Upload"}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5, marginTop: 4 }}>
                      Drag & drop your .csv file here, or click to browse
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>Or paste CSV raw contents directly:</div>
                    <textarea
                      value={csvText}
                      onChange={e => setCsvText(e.target.value)}
                      placeholder="VIN,Stock,Year,Make,Model,Price...&#10;1HGCP2F...,17121,2010,Honda,Accord,10900..."
                      style={{
                        height: 120,
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        padding: 10,
                        color: "#fff",
                        fontFamily: "monospace",
                        fontSize: 11.5,
                        outline: "none",
                        resize: "none"
                      }}
                    />
                  </div>

                  {csvError && (
                    <div style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: 8,
                      padding: 12,
                      color: "#f87171",
                      display: "flex",
                      gap: 8,
                      alignItems: "center"
                    }}>
                      <Icon.AlertTriangle size={16}/>
                      <span style={{ fontWeight: 600 }}>{csvError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Configure Mappings */}
              {csvStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Configure Column Mapping</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                      Map the columns from your CSV file to GetGoGone's normalized vehicle specs. We've auto-detected these based on synonyms.
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    background: "#0f172a",
                    borderRadius: 10,
                    padding: 16,
                    maxHeight: 280,
                    overflowY: "auto"
                  }}>
                    {Object.keys(customMapping).map((field) => {
                      const label = field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={field} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 500, color: "#94a3b8" }}>{label}</span>
                          <select
                            value={customMapping[field] || ""}
                            onChange={(e) => {
                              setCustomMapping({
                                ...customMapping,
                                [field]: e.target.value
                              });
                            }}
                            style={{
                              background: "#1e293b",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: 6,
                              padding: "6px 8px",
                              color: "#fff",
                              fontSize: 12,
                              outline: "none"
                            }}
                          >
                            <option value="">-- Skip Field --</option>
                            {csvHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>

                  {/* Preview Rows */}
                  {previewRows && previewRows.length > 0 && (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 11.5, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>CSV Rows Preview</div>
                      <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                          <thead>
                            <tr style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                              {csvHeaders.slice(0, 5).map(h => (
                                <th key={h} style={{ padding: "8px 10px", fontWeight: 600, color: "#94a3b8" }}>{h}</th>
                              ))}
                              {csvHeaders.length > 5 && <th style={{ padding: "8px 10px", color: "rgba(255,255,255,0.4)" }}>...</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.map((row, idx) => (
                              <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                {csvHeaders.slice(0, 5).map(h => (
                                  <td key={h} style={{ padding: "6px 10px", color: "rgba(255,255,255,0.7)" }}>{row[h]}</td>
                                ))}
                                {csvHeaders.length > 5 && <td style={{ padding: "6px 10px", color: "rgba(255,255,255,0.3)" }}>...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 20, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={overwriteCsv} 
                        onChange={e => setOverwriteCsv(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>Overwrite Existing</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Update specs and photos for matching VINs</div>
                      </div>
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={dryRunCsv} 
                        onChange={e => setDryRunCsv(e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>Dry Run Preview</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Validate files without writing to database</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: Loading Screen */}
              {csvStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 14 }}>
                  <div className="spinner" style={{
                    width: 36,
                    height: 36,
                    border: "3px solid rgba(16, 185, 129, 0.2)",
                    borderTop: "3px solid #10b981",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}/>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Importing CSV records...</div>
                    <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 12, marginTop: 4 }}>
                      This can take a minute for large files. Results will appear when the import finishes.
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Results */}
              {csvStep === 4 && csvResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: 8,
                    padding: 14,
                    color: "#34d399",
                    display: "flex",
                    gap: 8,
                    alignItems: "center"
                  }}>
                    <Icon.CheckCircle size={18}/>
                    <div style={{ fontWeight: 600 }}>
                      {dryRunCsv ? "CSV Dry Run Inspection Complete!" : "CSV Inventory Import Successful!"}
                    </div>
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                    background: "#0f172a",
                    borderRadius: 8,
                    padding: 14,
                    textAlign: "center"
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Total Rows</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#3b82f6" }}>
                        {csvResult.pipelineResult?.totalRecords ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Inserted</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#10b981" }}>
                        {csvResult.pipelineResult?.inserted ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Updated</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#f59e0b" }}>
                        {csvResult.pipelineResult?.updated ?? 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Failed</div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "#ef4444" }}>
                        {csvResult.pipelineResult?.errors ?? 0}
                      </div>
                    </div>
                  </div>

                  {csvResult.pipelineResult?.rows?.some(r => r.action === "error") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#f87171" }}>Pipeline errors:</div>
                      <div style={{
                        background: "#0f172a",
                        borderRadius: 6,
                        maxHeight: 150,
                        overflowY: "auto",
                        padding: 10,
                        fontSize: 11.5,
                        fontFamily: "monospace",
                        color: "#f87171"
                      }}>
                        {csvResult.pipelineResult.rows.filter(r => r.action === "error").map((row, idx) => (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            <strong>{row.year} {row.make} {row.model} (Stock# {row.stockNumber || "N/A"})</strong>: {row.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(15, 23, 42, 0.4)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12
            }}>
              {csvStep === 1 && (
                <>
                  <Btn 
                    variant="ghost" 
                    onClick={() => setShowCsvModal(false)}
                    disabled={importingCsv}
                  >
                    Cancel
                  </Btn>
                  <Btn 
                    variant="primary" 
                    onClick={() => analyzeCsv(csvText)}
                    disabled={!csvText.trim() || importingCsv}
                    icon={Icon.Sparkles}
                  >
                    {importingCsv ? "Analyzing..." : "Analyze Format"}
                  </Btn>
                </>
              )}

              {csvStep === 2 && (
                <>
                  <Btn 
                    variant="ghost" 
                    onClick={() => setCsvStep(1)}
                  >
                    Back
                  </Btn>
                  <Btn 
                    variant="primary" 
                    onClick={handleCsvImport}
                    icon={Icon.CheckCircle}
                  >
                    Execute Ingestion
                  </Btn>
                </>
              )}

              {csvStep === 4 && (
                <Btn 
                  variant="primary" 
                  onClick={() => {
                    setShowCsvModal(false);
                    setCsvResult(null);
                    setCsvError(null);
                    setCsvStep(1);
                  }}
                >
                  Close Window
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Vehicle Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: "#1e293b",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 16,
            width: "100%",
            maxWidth: 680,
            maxHeight: "90vh",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            color: "#fff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon.Plus size={18} style={{ color: "#3b82f6" }}/>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Create New Listing Manually</h3>
              </div>
              <button 
                onClick={() => {
                  if (!savingManual) {
                    setShowAddModal(false);
                    resetManualForm();
                  }
                }}
                disabled={savingManual}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4
                }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form */}
            <div style={{ padding: 24, fontSize: 13, lineHeight: 1.5, overflowY: "auto", flex: 1 }}>
              
              {/* VIN Autofill Bar */}
              <div style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-end",
                marginBottom: 20,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                paddingBottom: 20
              }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ⚡ Instant Spec Autofill by VIN
                  </label>
                  <input 
                    type="text" 
                    value={manualVin} 
                    onChange={e => setManualVin(e.target.value.toUpperCase())}
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
                    style={{
                      background: "#0f172a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      color: "#fff",
                      fontFamily: "monospace",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
                <Btn 
                  variant="dark" 
                  onClick={handleQuickDecode} 
                  disabled={decodingVin || !manualVin || manualVin.trim().length !== 17}
                  icon={Icon.Sparkles}
                >
                  {decodingVin ? "Decoding..." : "Autofill Specs"}
                </Btn>
              </div>

              {/* Status Flashes */}
              {manualError && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: 8,
                  padding: 12,
                  color: "#f87171",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 16
                }}>
                  <Icon.AlertTriangle size={16}/>
                  <span style={{ fontWeight: 600 }}>{manualError}</span>
                </div>
              )}

              {manualSuccessMsg && (
                <div style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  borderRadius: 8,
                  padding: 12,
                  color: "#34d399",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 16
                }}>
                  <Icon.CheckCircle size={16}/>
                  <span style={{ fontWeight: 600 }}>{manualSuccessMsg}</span>
                </div>
              )}

              {/* Two-Column Form Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 20
              }}>
                {/* COLUMN 1 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Stock #</span>
                    <input type="text" value={manualStock} onChange={e => setManualStock(e.target.value)} placeholder="e.g. 17177" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Model Year</span>
                    <input type="number" value={manualYear} onChange={e => setManualYear(e.target.value)} placeholder="e.g. 2016" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Make (Brand)</span>
                    <input type="text" value={manualMake} onChange={e => setManualMake(e.target.value)} placeholder="e.g. Jeep" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Model</span>
                    <input type="text" value={manualModel} onChange={e => setManualModel(e.target.value)} placeholder="e.g. Wrangler" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Trim</span>
                    <input type="text" value={manualTrim} onChange={e => setManualTrim(e.target.value)} placeholder="e.g. Unlimited Sport" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Body Style</span>
                    <input type="text" value={manualBody} onChange={e => setManualBody(e.target.value)} placeholder="e.g. SUV, Truck, Sedan" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Mileage (Odometer)</span>
                    <input type="number" value={manualMileage} onChange={e => setManualMileage(e.target.value)} placeholder="e.g. 45000" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Engine Size</span>
                    <input type="text" value={manualEngine} onChange={e => setManualEngine(e.target.value)} placeholder="e.g. 3.6L V6" style={inputStyle}/>
                  </div>
                </div>

                {/* COLUMN 2 */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Retail Price ($)</span>
                    <input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="e.g. 15900" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Ad Down Payment ($)</span>
                    <input type="number" value={manualDown} onChange={e => setManualDown(e.target.value)} placeholder="Leave blank for auto fallbacks" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Transmission</span>
                    <input type="text" value={manualTrans} onChange={e => setManualTrans(e.target.value)} placeholder="e.g. 5-Speed Automatic" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Drivetrain</span>
                    <input type="text" value={manualDrive} onChange={e => setManualDrive(e.target.value)} placeholder="e.g. 4WD, FWD, RWD" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Fuel Type</span>
                    <input type="text" value={manualFuel} onChange={e => setManualFuel(e.target.value)} placeholder="e.g. Gasoline" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Exterior Color</span>
                    <input type="text" value={manualExtColor} onChange={e => setManualExtColor(e.target.value)} placeholder="e.g. White" style={inputStyle}/>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Interior Color</span>
                    <input type="text" value={manualIntColor} onChange={e => setManualIntColor(e.target.value)} placeholder="e.g. Black cloth" style={inputStyle}/>
                  </div>
                </div>
              </div>

              {/* Full Width Description */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Marketing Description</span>
                <textarea 
                  value={manualDesc} 
                  onChange={e => setManualDesc(e.target.value)} 
                  placeholder="Enter copywriting highlights, package options, and dealer remarks..."
                  style={{
                    height: 90,
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: 10,
                    color: "#fff",
                    fontSize: 12.5,
                    outline: "none",
                    resize: "none"
                  }}
                />
              </div>

              {/* History Report URL */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Vehicle History Report URL (Optional)</span>
                <input 
                  type="text" 
                  value={manualHistoryUrl} 
                  onChange={e => setManualHistoryUrl(e.target.value)} 
                  placeholder="e.g. https://www.carfax.com/VehicleHistory/report?vin=..." 
                  style={{
                    background: "#0f172a",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 8,
                    padding: "10px 12px",
                    color: "#fff",
                    fontSize: 13,
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(15, 23, 42, 0.4)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12
            }}>
              <Btn 
                variant="ghost" 
                onClick={() => {
                  setShowAddModal(false);
                  resetManualForm();
                }}
                disabled={savingManual}
              >
                Cancel
              </Btn>
              <Btn 
                variant="primary" 
                onClick={handleSaveManual}
                disabled={savingManual || !manualYear || !manualMake || !manualModel}
                icon={Icon.CheckCircle}
              >
                {savingManual ? "Saving..." : "Create Listing"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function readinessTone(status) {
  if (status === "ready") return "green";
  if (status === "needs_work") return "amber";
  return "red";
}


export { Inventory };
