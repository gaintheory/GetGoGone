import React from 'react';
import { Icon } from '../icons';
import { GGG } from '../data';
import { UI } from '../ui';
import { VehicleMedia } from '../vehicle-media';

// Creative preview formats: square feed, story, craigslist, banner, flyer

function CreativePreview({ v, format, headline, body, language }) {
  const { fmt$, fmtMi } = GGG;
  const isEs = language === "es";
  const downDisplay = safeDownValue(v, fmt$, isEs);
  const priceDisplay = safePriceValue(v, fmt$);
  const weeklyDisplay = Number(v.weekly) > 0 ? fmt$(v.weekly) : "Terms";

  if (format === "square") {
    return (
      <div style={{ width: 320, background: "#fff", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", gap: 8, borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#111827", color: "#fff", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700 }}>GGG</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Wabash Auto Sales</div>
            <div style={{ fontSize: 9.5, color: "var(--text-2)" }}>Sponsored · 🚗</div>
          </div>
          <Icon.More size={14}/>
        </div>
        <div style={{ aspectRatio: "1/1", position: "relative", background: "var(--gray-100)" }}>
          <VehicleMedia v={v}/>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 12px 14px", background: "linear-gradient(transparent, rgba(0,0,0,0.78))", color: "#fff" }}>
            <div style={{ fontSize: 10, opacity: 0.85, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isEs ? "ENGANCHE BAJO" : "LOW DOWN PAYMENT"}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{headline}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Stat label={isEs ? "ENGANCHE" : "DOWN"} value={downDisplay}/>
              <Stat label={isEs ? "TERM" : "TERMS"} value={weeklyDisplay}/>
              <Stat label="MI" value={Math.round(v.mileage/1000)+"k"}/>
            </div>
          </div>
          <div style={{ position: "absolute", top: 10, right: 10, background: "#DC2626", color: "#fff", padding: "3px 8px", borderRadius: 3, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
            {isEs ? "FINANCIAMOS" : "WE FINANCE"}
          </div>
        </div>
        <div style={{ padding: "8px 10px", display: "flex", gap: 8, fontSize: 11, color: "var(--text-2)" }}>
          <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
          <div style={{ marginLeft: "auto", background: "#2563EB", color: "#fff", padding: "3px 9px", borderRadius: 3, fontSize: 10.5, fontWeight: 600 }}>
            {isEs ? "Ver Más" : "Learn More"}
          </div>
        </div>
        <div style={{ padding: "0 10px 10px", fontSize: 10.5, color: "var(--text-2)", lineHeight: 1.4 }}>
          Subject to approval of credit. WAC.
        </div>
      </div>
    );
  }

  if (format === "story") {
    return (
      <div style={{ width: 220, aspectRatio: "9/16", borderRadius: 12, overflow: "hidden", position: "relative", background: "#0f172a", boxShadow: "var(--shadow-lg)" }}>
        <VehicleMedia v={v} style={{ position: "absolute", inset: 0 }}/>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.9) 100%)" }}/>
        <div style={{ position: "absolute", top: 8, left: 8, right: 8, display: "flex", gap: 3 }}>
          {[1,1,0.3,0.3,0.3].map((o,i) => (
            <div key={i} style={{ flex: 1, height: 2, background: `rgba(255,255,255,${o})`, borderRadius: 1 }}/>
          ))}
        </div>
        <div style={{ position: "absolute", top: 18, left: 8, right: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", color: "#111", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700 }}>GGG</div>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>wabashauto</span>
        </div>
        <div style={{ position: "absolute", top: "30%", left: 16, right: 16, color: "#fff" }}>
          <div style={{ background: "#DC2626", display: "inline-block", padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: "0.05em" }}>
            {isEs ? "OFERTA" : "DEAL ALERT"}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.05, marginTop: 8, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            {headline}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 50, left: 16, right: 16, color: "#fff" }}>
          <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }}>{v.year} · {fmtMi(v.mileage)} · {v.color}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <Stat label={isEs ? "ENG" : "DOWN"} value={downDisplay}/>
            <Stat label={isEs ? "TERM" : "TERMS"} value={weeklyDisplay}/>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16, background: "rgba(255,255,255,0.95)", borderRadius: 999, padding: "8px 12px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#111" }}>
          ☝ {isEs ? "Aplica ahora" : "Apply now — swipe up"}
        </div>
      </div>
    );
  }

  if (format === "cl") {
    return (
      <div style={{ width: 340, background: "#fff", border: "1px solid var(--border)", borderRadius: 4, overflow: "hidden", fontFamily: "Georgia, serif" }}>
        <div style={{ background: "#5C3D7E", color: "#fff", padding: "6px 10px", fontSize: 11, fontFamily: "Arial, sans-serif" }}>
          indianapolis &gt; cars+trucks &gt; by dealer
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1a0dab", textDecoration: "underline", marginBottom: 4, fontFamily: "Arial, sans-serif" }}>
            {v.year} {v.make} {v.model} {v.trim} - {priceDisplay} ({downDisplay})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 10 }}>
            <div style={{ aspectRatio: "4/3", border: "1px solid var(--border)" }}><VehicleMedia v={v}/></div>
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4 }}>
              <div style={{ border: "1px solid var(--border)" }}><VehicleMedia v={v}/></div>
              <div style={{ border: "1px solid var(--border)" }}><VehicleMedia v={v}/></div>
            </div>
          </div>
          <table style={{ width: "100%", fontSize: 11, fontFamily: "Arial, sans-serif", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={{ padding: "2px 0", color: "#666", width: 80 }}>condition:</td><td>excellent</td></tr>
              <tr><td style={{ padding: "2px 0", color: "#666" }}>odometer:</td><td>{fmtMi(v.mileage)}</td></tr>
              <tr><td style={{ padding: "2px 0", color: "#666" }}>title status:</td><td>clean</td></tr>
              <tr><td style={{ padding: "2px 0", color: "#666" }}>transmission:</td><td>automatic</td></tr>
            </tbody>
          </table>
          <div style={{ fontSize: 12, lineHeight: 1.5, fontFamily: "Arial, sans-serif", marginTop: 10, color: "#222" }}>
            {body.slice(0, 260)}...
          </div>
        </div>
      </div>
    );
  }

  if (format === "banner") {
    return (
      <div style={{ width: 360, height: 132, background: "#fff", borderRadius: "var(--radius)", overflow: "hidden", position: "relative", boxShadow: "var(--shadow)", border: "1px solid var(--border)" }}>
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "150px 1fr" }}>
          <div style={{ background: "var(--gray-100)" }}><VehicleMedia v={v}/></div>
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 8.5, color: "#DC2626", fontWeight: 700, letterSpacing: "0.08em" }}>{isEs ? "ENGANCHE BAJO" : "LOW DOWN PAYMENT"}</div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 2 }}>
                {v.year} {v.make} {v.model}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-2)" }}>{v.color} · {fmtMi(v.mileage)}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 8, color: "var(--text-2)", letterSpacing: "0.05em" }}>{isEs ? "ENGANCHE" : "OFFER"}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--primary)", letterSpacing: "-0.02em" }}>{downDisplay}</div>
              </div>
              <div style={{ background: "var(--primary)", color: "#fff", padding: "4px 10px", borderRadius: 3, fontSize: 10, fontWeight: 700 }}>
                {isEs ? "APLICA →" : "APPLY →"}
              </div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 6, left: 6, background: "#111", color: "#fff", fontSize: 7.5, padding: "2px 5px", borderRadius: 2, fontWeight: 700 }}>GGG</div>
      </div>
    );
  }

  if (format === "flyer") {
    return (
      <div style={{ width: 280, aspectRatio: "8.5/11", background: "#fff", boxShadow: "var(--shadow-lg)", padding: 16, display: "flex", flexDirection: "column", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", paddingBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "var(--text-2)", letterSpacing: "0.1em", fontWeight: 600 }}>WABASH AUTO SALES</div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em" }}>Get.Go.Gone.</div>
          </div>
          <div style={{ width: 28, height: 28, background: "#111", color: "#fff", borderRadius: 4, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 11 }}>GGG</div>
        </div>
        <div style={{ aspectRatio: "4/3", marginTop: 10, background: "var(--gray-100)" }}><VehicleMedia v={v}/></div>
        <div style={{ background: "#DC2626", color: "#fff", padding: "4px 8px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textAlign: "center", marginTop: 8 }}>
          {isEs ? "OPCIONES DE FINANCIAMIENTO" : "FINANCING OPTIONS AVAILABLE"}
        </div>
        <div style={{ marginTop: 10, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.1 }}>{v.year} {v.make} {v.model}</div>
          <div style={{ fontSize: 9, color: "var(--text-2)" }}>{v.trim} · {fmtMi(v.mileage)} · {v.color}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
          <FlyerStat label={isEs ? "ENG" : "DOWN"} value={downDisplay}/>
          <FlyerStat label={isEs ? "TERM" : "TERMS"} value={weeklyDisplay} hi/>
          <FlyerStat label="PRICE" value={priceDisplay}/>
        </div>
        <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)", fontSize: 8.5, color: "var(--text-2)", lineHeight: 1.4 }}>
          <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 9.5 }}>📞 (317) 555-0100 · wabashauto.com</div>
          <div style={{ marginTop: 4 }}>2451 W Washington St, Indianapolis IN. Subject to approval of credit. WAC. Tax, title, license additional. Dealer #IN-447128.</div>
        </div>
      </div>
    );
  }

  return null;
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 7.5, opacity: 0.7, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}

function safeDownValue(v, fmt$, spanish = false) {
  return Number(v.down) > 0 ? fmt$(v.down) : spanish ? "Opciones" : "Options";
}

function safePriceValue(v, fmt$) {
  return Number(v.price) > 0 ? fmt$(v.price) : "Call for price";
}

function FlyerStat({ label, value, hi }) {
  return (
    <div style={{ background: hi ? "#111" : "var(--gray-50)", color: hi ? "#fff" : "var(--text)", border: "1px solid var(--border)", borderRadius: 3, padding: "6px 4px", textAlign: "center" }}>
      <div style={{ fontSize: 7.5, opacity: 0.7, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}


export { CreativePreview };
