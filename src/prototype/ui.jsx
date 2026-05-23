import { Icon } from './icons';
import { GGG } from './data';

// Shared small UI components

function Pill({ tone = "gray", dot, children }) {
  return (
    <span className={`pill ${tone}`}>
      {dot && <span className="dot"/>}
      {children}
    </span>
  );
}

function Btn({ variant = "default", size, children, icon, iconRight, onClick, disabled, title, type }) {
  const cls = ["btn"];
  if (variant === "primary") cls.push("primary");
  if (variant === "dark") cls.push("dark");
  if (variant === "ghost") cls.push("ghost");
  if (variant === "danger") cls.push("danger");
  if (size === "sm") cls.push("sm");
  if (size === "lg") cls.push("lg");
  const I = icon, IR = iconRight;
  return (
    <button className={cls.join(" ")} onClick={onClick} disabled={disabled} title={title} type={type}>
      {I && <I size={14}/>}
      {children}
      {IR && <IR size={14}/>}
    </button>
  );
}

function VehicleThumb({ v, size = "sm" }) {
  const svg = GGG.vehicleSvg(v.body, v.palette);
  if (v.imageUrl) {
    return (
      <div className={`thumb ${size === "lg" ? "lg" : ""}`}>
        <img src={v.imageUrl} alt={`${v.year} ${v.make} ${v.model}`} loading="lazy"/>
      </div>
    );
  }
  return (
    <div className={`thumb ${size === "lg" ? "lg" : ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}/>
  );
}

function ChannelBadge({ ch, size = 22 }) {
  return (
    <div className="ch-badge" style={{ background: ch.color, width: size, height: size, flexBasis: size }}>
      {ch.short}
    </div>
  );
}

function Sparkline({ values, color = "#2563EB", w = 80, h = 28 }) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = Math.max(1, max - min);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / range) * (h - 4);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className={`tab ${value === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
          {t.label}{t.count != null && <span className="muted" style={{marginLeft: 6}}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function KPI({ label, value, delta, deltaTone = "up", icon, spark, sparkColor }) {
  const I = icon;
  return (
    <div className="kpi">
      <div className="label">{I && <I size={13}/>}{label}</div>
      <div className="value">{value}</div>
      {delta && <div className={`delta ${deltaTone}`}>
        {deltaTone === "up" ? <Icon.ArrowUp size={11}/> : <Icon.ArrowDown size={11}/>}
        {delta}
      </div>}
      {spark && <Sparkline values={spark} color={sparkColor}/>}
    </div>
  );
}

const UI = { Pill, Btn, VehicleThumb, ChannelBadge, Sparkline, Tabs, KPI };

export { UI, Pill, Btn, VehicleThumb, ChannelBadge, Sparkline, Tabs, KPI };
