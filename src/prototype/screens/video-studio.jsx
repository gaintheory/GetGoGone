import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { assessVehicleReadiness } from '../../features/inventory/readiness';

function VideoStudio({ nav, toast, vehicles: providedVehicles, clientId }) {
  const { VEHICLES, fmt$, fmtMi } = GGG;
  const { Pill, Btn, VehicleThumb } = UI;
  const vehicles = providedVehicles && providedVehicles.length ? providedVehicles : VEHICLES;

  // Parameters State
  const [vehicleId, setVehicleId] = React.useState(vehicles[0]?.id || "");
  const [goal, setGoal] = React.useState("finance");
  const [duration, setDuration] = React.useState(30);
  const [language, setLanguage] = React.useState("en");
  const [speaker, setSpeaker] = React.useState("warm_female");

  // Step/Tab State
  const [activeStep, setActiveStep] = React.useState("concept"); // "concept" | "storyboard" | "render"

  // Generated Script & Storyboard Data
  const [generatingScript, setGeneratingScript] = React.useState(false);
  const [script, setScript] = React.useState(null);
  
  const [generatingStoryboard, setGeneratingStoryboard] = React.useState(false);
  const [storyboard, setStoryboard] = React.useState([]);

  // Mock Render Timeline State
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [activeSceneIndex, setActiveSceneIndex] = React.useState(0);
  const [compiling, setCompiling] = React.useState(false);
  const [compiledAsset, setCompiledAsset] = React.useState(null);

  const vehicle = vehicles.find(item => item.id === vehicleId) || vehicles[0];
  const readiness = vehicle ? assessVehicleReadiness(vehicle) : null;

  // React Timer for Mock Video Player
  React.useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  // Sync active scene based on currentTime
  React.useEffect(() => {
    if (!storyboard || storyboard.length === 0) return;
    let accumulatedTime = 0;
    for (let i = 0; i < storyboard.length; i++) {
      accumulatedTime += storyboard[i].durationSeconds || 0;
      if (currentTime <= accumulatedTime) {
        setActiveSceneIndex(i);
        break;
      }
    }
  }, [currentTime, storyboard]);

  const handleGenerateScript = async () => {
    if (!vehicle) {
      toast("Select a vehicle first");
      return;
    }
    setGeneratingScript(true);
    setScript(null);
    setStoryboard([]);
    setActiveStep("concept");
    try {
      const res = await fetch("/api/video/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          vehicle,
          goal,
          duration,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate script.");
      setScript(data.script);
      toast("Video script and strategy generated!");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!script) {
      toast("Generate script first");
      return;
    }
    setGeneratingStoryboard(true);
    setStoryboard([]);
    try {
      const res = await fetch("/api/video/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          vehicle,
          script,
          goal,
          duration,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate storyboard.");
      setStoryboard(data.storyboard);
      setActiveStep("storyboard");
      toast("Storyboard shot-list generated!");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingStoryboard(false);
    }
  };

  const handleCompileVideo = async () => {
    if (!script || storyboard.length === 0) {
      toast("Generate script and storyboard first");
      return;
    }
    setCompiling(true);
    setCompiledAsset(null);
    try {
      const res = await fetch("/api/video/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          vehicleId: vehicle.id,
          title: `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${duration}s spot`,
          duration,
          script,
          storyboard,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compile video.");
      setCompiledAsset(data.asset);
      toast("Video package successfully compiled and registered!");
      setActiveStep("render");
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err));
    } finally {
      setCompiling(false);
    }
  };

  const handleEditScene = (index, field, value) => {
    const updated = [...storyboard];
    updated[index] = { ...updated[index], [field]: value };
    setStoryboard(updated);
  };

  const activeScene = storyboard[activeSceneIndex];

  return (
    <div className="page" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="page-h" style={{ marginBottom: 12 }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon.Sparkles style={{ color: "#3b82f6" }}/> Video Commercial Studio
          </h1>
          <div className="sub">Cinematic storyboard scripting, visual cue cards, and Google Omni-ready commercial planning.</div>
        </div>
        <div className="page-actions">
          {script && storyboard.length > 0 && (
            <Btn icon={Icon.CheckCircle} variant="primary" onClick={handleCompileVideo} disabled={compiling}>
              {compiling ? "Compiling..." : "Compile & Export Package"}
            </Btn>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 14, flex: 1, overflow: "hidden" }}>
        
        {/* Param sidebar */}
        <div className="card col" style={{ padding: 16, gap: 14, overflowY: "auto" }}>
          <div className="field">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>TARGET VEHICLE</label>
            <select className="select" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>
              ))}
            </select>
          </div>

          {vehicle && (
            <div style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(30, 41, 59, 0.5)",
              borderRadius: 8,
              padding: 9
            }}>
              <VehicleThumb v={vehicle} size="lg"/>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5 }}>{vehicle.year} {vehicle.make} {vehicle.model}</div>
                <div className="muted" style={{ fontSize: 11 }}>{fmtMi(vehicle.mileage)} · {vehicle.color || "Color not set"}</div>
                <div className="muted" style={{ fontSize: 11, fontWeight: 600, color: "#3b82f6" }}>
                  {vehicle.down ? `${fmt$(vehicle.down)} down` : "Down payment options"}
                </div>
              </div>
            </div>
          )}

          {readiness && (
            <div style={{
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 8,
              padding: 10,
              background: readiness.status === "ready" ? "rgba(16, 185, 129, 0.05)" : "rgba(245, 158, 11, 0.05)",
              fontSize: 11.5
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>Lot Readiness</span>
                <Pill tone={readiness.status === "ready" ? "green" : "amber"}>{readiness.score}/100</Pill>
              </div>
              <span className="muted" style={{ fontSize: 11 }}>{readiness.summary}</span>
            </div>
          )}

          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", margin: "4px 0" }}/>

          <div className="field">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>VIDEO STYLE / GOAL</label>
            <select className="select" value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="finance">Special Lot Financing</option>
              <option value="calls">Phone Ring & Message Pull</option>
              <option value="spanish">Comunidad Hispana Outreach</option>
              <option value="commercial">Commercial Work Truck/Van</option>
              <option value="fresh">Fresh Lot Arrival Spot</option>
              <option value="aging">Move Aging Inventory</option>
            </select>
          </div>

          <div className="field">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>TARGET DURATION</label>
            <select className="select" value={duration} onChange={e => {
              setDuration(Number(e.target.value));
              setStoryboard([]);
            }}>
              <option value={15}>15 Seconds Spot</option>
              <option value={30}>30 Seconds Spot</option>
              <option value={60}>60 Seconds Spot</option>
            </select>
          </div>

          <div className="field">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>VOICEOVER LANGUAGE</label>
            <select className="select" value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="en">English Voiceover</option>
              <option value="es">Spanish Voiceover</option>
            </select>
          </div>

          <div className="field">
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>SPEAKER VOICE PROFILE</label>
            <select className="select" value={speaker} onChange={e => setSpeaker(e.target.value)}>
              <option value="warm_female">Warm Storyteller (Female)</option>
              <option value="bold_male">Bold Radio announcer (Male)</option>
              <option value="spanish_native">Latin Spanish Narrator</option>
            </select>
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn icon={Icon.Sparkles} variant="primary" onClick={handleGenerateScript} disabled={generatingScript}>
              {generatingScript ? "Scripting..." : "Generate Concept Script"}
            </Btn>
            {script && (
              <Btn icon={Icon.Sparkles} onClick={handleGenerateStoryboard} disabled={generatingStoryboard}>
                {generatingStoryboard ? "Storyboarding..." : "Generate Storyboard"}
              </Btn>
            )}
          </div>
        </div>

        {/* Workspace panel */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          {/* Step bar */}
          <div className="row" style={{
            background: "#1e293b",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 8,
            padding: 4,
            marginBottom: 12
          }}>
            <button
              className={`nav-item ${activeStep === "concept" ? "active" : ""}`}
              onClick={() => setActiveStep("concept")}
              style={{
                flex: 1, padding: "8px 12px", border: "none", background: activeStep === "concept" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: activeStep === "concept" ? "#3b82f6" : "#94a3b8", fontWeight: 600, borderRadius: 6, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              1. Narrative Script
            </button>
            <button
              className={`nav-item ${activeStep === "storyboard" ? "active" : ""}`}
              onClick={() => {
                if (storyboard.length === 0) {
                  toast("Generate storyboard first");
                  return;
                }
                setActiveStep("storyboard");
              }}
              style={{
                flex: 1, padding: "8px 12px", border: "none", background: activeStep === "storyboard" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: activeStep === "storyboard" ? "#3b82f6" : "#94a3b8", fontWeight: 600, borderRadius: 6, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              2. Visual Storyboard ({storyboard.length} Scenes)
            </button>
            <button
              className={`nav-item ${activeStep === "render" ? "active" : ""}`}
              onClick={() => {
                if (storyboard.length === 0) {
                  toast("Setup script and storyboard first");
                  return;
                }
                setActiveStep("render");
              }}
              style={{
                flex: 1, padding: "8px 12px", border: "none", background: activeStep === "render" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: activeStep === "render" ? "#3b82f6" : "#94a3b8", fontWeight: 600, borderRadius: 6, cursor: "pointer", transition: "all 0.2s"
              }}
            >
              3. Interactive Mock Render
            </button>
          </div>

          {/* Main workspace container */}
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
            
            {/* Step 1 Content: Script */}
            {activeStep === "concept" && (
              <div className="col" style={{ gap: 12 }}>
                {!script && !generatingScript && (
                  <div className="card col" style={{ alignItems: "center", justifyContent: "center", padding: "80px 20px", borderStyle: "dashed" }}>
                    <Icon.Video size={48} style={{ color: "rgba(255,255,255,0.15)", marginBottom: 16 }}/>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Create Your Commercial Script</h3>
                    <p className="muted" style={{ margin: "6px 0 20px", fontSize: 12.5, textAlign: "center", maxWidth: 380 }}>
                      Select a lot vehicle and ad goal in the left panel, then hit Generate Concept Script to write compliant hook and narrative elements.
                    </p>
                    <Btn icon={Icon.Sparkles} variant="primary" onClick={handleGenerateScript}>
                      Generate Concept Script
                    </Btn>
                  </div>
                )}

                {generatingScript && (
                  <div className="card col" style={{ alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
                    <div className="loading" style={{ width: 32, height: 32, border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }}/>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Generating Script & Strategy...</h3>
                    <span className="muted" style={{ fontSize: 12, marginTop: 4 }}>Reading Brand Brain rules and lot vehicle details.</span>
                  </div>
                )}

                {script && (
                  <div className="card col" style={{ padding: 20, gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{script.title}</h3>
                        <span className="muted" style={{ fontSize: 11.5 }}>Duration: {duration} seconds | Goal fit: {goal}</span>
                      </div>
                      <Pill tone="green">Ready for storyboard</Pill>
                    </div>

                    <div className="col" style={{ gap: 12 }}>
                      <div className="field">
                        <label style={{ color: "#3b82f6", display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon.Sparkles size={13}/> Timed Intro Hook (0s - 5s)
                        </label>
                        <input
                          className="input"
                          value={script.hook}
                          onChange={e => setScript({ ...script, hook: e.target.value })}
                          style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13 }}
                        />
                      </div>

                      <div className="field">
                        <label style={{ color: "#94a3b8" }}>Narrative Walkaround Dialogue (5s - 25s)</label>
                        <textarea
                          className="input"
                          value={script.body}
                          onChange={e => setScript({ ...script, body: e.target.value })}
                          rows={6}
                          style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, resize: "none" }}
                        />
                      </div>

                      <div className="field">
                        <label style={{ color: "#f87171", display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon.AlertTriangle size={13}/> Required Regulation Z Disclaimer
                        </label>
                        <textarea
                          className="input"
                          value={script.disclaimer}
                          onChange={e => setScript({ ...script, disclaimer: e.target.value })}
                          rows={2}
                          style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, resize: "none" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                      <Btn icon={Icon.Sparkles} variant="primary" onClick={handleGenerateStoryboard} disabled={generatingStoryboard}>
                        {generatingStoryboard ? "Storyboarding..." : "Proceed to Storyboard"}
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2 Content: Storyboard Cards Grid */}
            {activeStep === "storyboard" && (
              <div className="col" style={{ gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span className="muted" style={{ fontSize: 12.5 }}>Each card represents a cinematic visual shot timed side-by-side with script narration.</span>
                  <Btn icon={Icon.Refresh} onClick={handleGenerateStoryboard} disabled={generatingStoryboard}>
                    Regenerate Shots
                  </Btn>
                </div>

                {generatingStoryboard && (
                  <div className="card col" style={{ alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
                    <div className="loading" style={{ width: 32, height: 32, border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 16 }}/>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Generating Storyboard Scenes...</h3>
                    <span className="muted" style={{ fontSize: 12, marginTop: 4 }}>Creating cinematic shot list and timing constraints.</span>
                  </div>
                )}

                {!generatingStoryboard && storyboard.map((scene, index) => (
                  <div key={index} className="card" style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, padding: 16 }}>
                    {/* Scene Timing Tag */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(59, 130, 246, 0.08)",
                      border: "1px solid rgba(59, 130, 246, 0.15)",
                      borderRadius: 8,
                      height: "100%",
                      padding: 10,
                      color: "#3b82f6"
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>SHOT</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>#{scene.shotNumber}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, whiteSpace: "nowrap" }}>{scene.durationSeconds} Secs</div>
                    </div>

                    {/* Scene fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="col" style={{ gap: 8 }}>
                        <div className="field">
                          <label style={{ fontSize: 11, color: "#3b82f6" }}>🎥 Omni Visual Prompt (Text-to-Video Action)</label>
                          <textarea
                            className="input"
                            value={scene.visualAction}
                            onChange={e => handleEditScene(index, "visualAction", e.target.value)}
                            rows={3}
                            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, resize: "none" }}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: 11, color: "#94a3b8" }}>Overlay Text Display</label>
                          <input
                            className="input"
                            value={scene.overlayText || ""}
                            onChange={e => handleEditScene(index, "overlayText", e.target.value)}
                            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12 }}
                            placeholder="No on-screen graphic card"
                          />
                        </div>
                      </div>

                      <div className="col" style={{ gap: 8 }}>
                        <div className="field">
                          <label style={{ fontSize: 11, color: "#94a3b8" }}>🎙️ Scene Audio dialogue (Voiceover Line)</label>
                          <textarea
                            className="input"
                            value={scene.audioScript}
                            onChange={e => handleEditScene(index, "audioScript", e.target.value)}
                            rows={3}
                            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, resize: "none" }}
                          />
                        </div>
                        <div className="field">
                          <label style={{ fontSize: 11, color: "#94a3b8" }}>Camera Pacing Style</label>
                          <select
                            className="select"
                            value={scene.cameraPacing}
                            onChange={e => handleEditScene(index, "cameraPacing", e.target.value)}
                            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, height: 32 }}
                          >
                            <option value="cinematic sweep">Cinematic sweep</option>
                            <option value="interior glide">Interior glide</option>
                            <option value="slow zoom">Slow zoom out</option>
                            <option value="reveal">Headlight Reveal</option>
                            <option value="street track">Street track</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {storyboard.length > 0 && (
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                    <Btn icon={Icon.Video} variant="primary" onClick={() => setActiveStep("render")}>
                      Proceed to Interactive Mock Render
                    </Btn>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 Content: Interactive Mock Video player */}
            {activeStep === "render" && (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14, alignItems: "start" }}>
                
                {/* Simulated Video Canvas */}
                <div className="col" style={{ gap: 12 }}>
                  <div style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16/9",
                    background: "#020617",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {/* Active vehicle image / mock visual representation with pan transition */}
                    {vehicle && (
                      <img
                        src={vehicle.imageUrl || `/images/fallback-vehicle.jpg`}
                        alt="Vehicle Visual"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "brightness(0.9)",
                          transition: "transform 5s ease-in-out",
                          transform: isPlaying ? "scale(1.1) translate(10px, -5px)" : "scale(1) translate(0, 0)"
                        }}
                      />
                    )}

                    {/* Dark gradient overlay */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(2, 6, 23, 0.9) 10%, rgba(2, 6, 23, 0.25) 50%, rgba(2, 6, 23, 0.5) 100%)"
                    }}/>

                    {/* On-screen Visual overlays */}
                    {activeScene && activeScene.overlayText && (
                      <div style={{
                        position: "absolute",
                        top: "20%",
                        left: "10%",
                        right: "10%",
                        background: "rgba(15, 23, 42, 0.85)",
                        backdropFilter: "blur(6px)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        padding: "16px 20px",
                        borderRadius: 12,
                        textAlign: "center",
                        animation: "fadeIn 0.5s ease-out",
                        boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.2)"
                      }}>
                        <h2 style={{
                          margin: 0,
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#fff",
                          letterSpacing: "0.08em",
                          textShadow: "0 2px 4px rgba(0,0,0,0.5)"
                        }}>
                          {activeScene.overlayText.toUpperCase()}
                        </h2>
                      </div>
                    )}

                    {/* Timing Overlay */}
                    <div style={{
                      position: "absolute",
                      top: 14,
                      right: 14,
                      background: "rgba(15, 23, 42, 0.8)",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "monospace",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#94a3b8"
                    }}>
                      {currentTime.toFixed(1)}s / {duration}s
                    </div>

                    {/* TIMED CAPTIONS AT BOTTOM */}
                    {activeScene && (
                      <div style={{
                        position: "absolute",
                        bottom: "8%",
                        left: "5%",
                        right: "5%",
                        textAlign: "center",
                        minHeight: 48,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <div style={{
                          background: "rgba(0, 0, 0, 0.75)",
                          padding: "6px 14px",
                          borderRadius: 6,
                          color: "#fef08a", // Soft caption yellow
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: 1.4,
                          maxWidth: "85%",
                          border: "1px solid rgba(255,255,255,0.05)"
                        }}>
                          🎙️ {activeScene.audioScript}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player Controls */}
                  <div className="card" style={{
                    padding: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(30, 41, 59, 0.5)"
                  }}>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: isPlaying ? "#ea580c" : "#3b82f6",
                        border: "none",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {isPlaying ? <Icon.Pause size={16}/> : <Icon.Play size={16}/>}
                    </button>

                    {/* Progress Slider */}
                    <div style={{ flex: 1, position: "relative", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3 }}>
                      <div style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${(currentTime / duration) * 100}%`,
                        background: "#3b82f6",
                        borderRadius: 3
                      }}/>
                    </div>

                    <span style={{ fontSize: 12, fontFamily: "monospace", minWidth: 42 }}>
                      {Math.floor(currentTime)}:00
                    </span>
                  </div>
                </div>

                {/* Compilation Status & Package Export */}
                <div className="col" style={{ gap: 12 }}>
                  <div className="card" style={{ padding: 16 }}>
                    <div className="card-h" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 10 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>Export Strategy Manifest</div>
                    </div>
                    <div className="card-b col" style={{ gap: 12, marginTop: 12, fontSize: 12.5 }}>
                      <div style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,23,42,0.3)", borderRadius: 8, padding: 10 }}>
                        <div style={{ fontWeight: 600, color: "#3b82f6" }}>Google Omni Ingestion Spec</div>
                        <span className="muted" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                          Pre-compiled vertical format package includes shot prompts, subtitles, and scene configurations ready for video rendering engines.
                        </span>
                      </div>

                      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}/>

                      {compiledAsset ? (
                        <div className="col" style={{ gap: 8 }}>
                          <div style={{
                            background: "rgba(16, 185, 129, 0.08)",
                            border: "1px solid rgba(16, 185, 129, 0.15)",
                            borderRadius: 8,
                            padding: 10,
                            color: "#10b981",
                            display: "flex",
                            gap: 8,
                            alignItems: "center"
                          }}>
                            <Icon.CheckCircle size={16}/>
                            <span style={{ fontWeight: 600 }}>Asset Persisted to Supabase!</span>
                          </div>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, background: "rgba(15,23,42,0.2)", padding: 8, borderRadius: 6, fontSize: 11.5 }}>
                            <div><span className="muted">Format:</span> mp4</div>
                            <div><span className="muted">Path:</span> <span style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{compiledAsset.storage_path || "Default Storage"}</span></div>
                            <div><span className="muted">Manifest:</span> {storyboard.length} timed scenes registered</div>
                          </div>

                          <Btn icon={Icon.ChevronRight} onClick={() => nav("creatives")}>
                            Go to Creatives Library
                          </Btn>
                        </div>
                      ) : (
                        <div className="col" style={{ gap: 8 }}>
                          <span className="muted" style={{ fontSize: 11.5 }}>
                            Compile the storyboard scenes to generate a campaign asset record inside the GetGoGone database.
                          </span>
                          <Btn icon={Icon.CheckCircle} variant="primary" onClick={handleCompileVideo} disabled={compiling}>
                            {compiling ? "Compiling Project..." : "Compile & Export Video"}
                          </Btn>
                        </div>
                      )}
                    </div>
                  </div>

                  {activeScene && (
                    <div className="card col" style={{ padding: 14, gap: 10, background: "rgba(15, 23, 42, 0.3)" }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#3b82f6", textTransform: "uppercase" }}>
                        Active Shot Prompt Details
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                        <div><span className="muted">Pacing:</span> {activeScene.cameraPacing}</div>
                        <div><span className="muted">Scene Action Prompt:</span></div>
                        <div style={{ background: "rgba(15,23,42,0.6)", padding: 8, borderRadius: 6, fontFamily: "monospace", fontSize: 11, lineHeight: 1.45, color: "#e2e8f0" }}>
                          {activeScene.visualAction}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { VideoStudio };
