import { Field }  from './components/Field';
import { SectionLabel } from './components/SectionLabel';

// ─── placeholder data ─────────────────────────────────────────────────────────

const KEPLERIAN = {
  a:     '6 786',
  e:     '0.002',
  i:     '51.6',
  raan:  '247.0',
  omega: '130.0',
  nu:    '332.5',
};

const CARTESIAN = {
  x:  '−2 768.3',
  y:  '5 897.1',
  z:  '2 211.6',
  vx: '−5.214',
  vy: '−3.892',
  vz: '4.671',
  r:  '6 799.1',
  v:  '7.656',
};

// ─── panel header ─────────────────────────────────────────────────────────────

function PanelHeader({
  dot,
  title,
  badge,
}: {
  dot: 'blue' | 'green';
  title: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            dot === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
          }`}
        />
        <span className="text-[11px] font-semibold tracking-[0.12em] text-slate-700 uppercase">
          {title}
        </span>
      </div>
      <span className="text-sm text-slate-400">{badge}</span>
    </div>
  );
}

// ─── app ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* top bar */}
      <header className="flex items-center justify-between px-10 py-5 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
            Orbital element converter
          </h1>
          <span className="text-sm text-blue-500 border border-blue-200 bg-blue-50 rounded-full px-3 py-0.5">
            Keplerian ↔ Cartesian
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="
            flex items-center gap-1.5 text-sm text-slate-600
            border border-slate-200 rounded-lg px-3.5 py-1.5
            hover:bg-slate-50 transition-colors
          ">
            ↺ Reset
          </button>
          <button className="
            flex items-center gap-1.5 text-sm text-slate-600
            border border-slate-200 rounded-lg px-3.5 py-1.5
            hover:bg-slate-50 transition-colors
          ">
            ⧉ Copy JSON
          </button>
        </div>
      </header>

      {/* main content */}
      <main className="flex flex-1">

        {/* ── left: keplerian ── */}
        <section className="flex-1 px-10 py-8 border-r border-slate-100 bg-white">
          <PanelHeader dot="blue" title="Keplerian elements" badge="inputs" />

          <SectionLabel>Shape</SectionLabel>
          <Field symbol="a" label="Semi-major axis" value={KEPLERIAN.a}     unit="km"  />
          <Field symbol="e" label="Eccentricity"    value={KEPLERIAN.e}     unit="—"   />

          <SectionLabel>Orientation</SectionLabel>
          <Field symbol="i" label="Inclination"         value={KEPLERIAN.i}     unit="deg" />
          <Field symbol="Ω" label="RAAN"                value={KEPLERIAN.raan}  unit="deg" />
          <Field symbol="ω" label="Arg. of periapsis"   value={KEPLERIAN.omega} unit="deg" />

          <SectionLabel>Position</SectionLabel>
          <Field symbol="ν" label="True anomaly" value={KEPLERIAN.nu} unit="deg" />
        </section>

        {/* ── exchange icon ── */}
        <div className="flex items-center justify-center w-14 shrink-0 bg-white border-r border-slate-100">
          <span className="text-lg text-slate-300 select-none">⇌</span>
        </div>

        {/* ── right: cartesian ── */}
        <section className="flex-1 px-10 py-8 bg-white">
          <PanelHeader dot="green" title="Cartesian state vector" badge="computed" />

          <SectionLabel>Position (ECI)</SectionLabel>
          <Field symbol="x"  value={CARTESIAN.x}  unit="km"   />
          <Field symbol="y"  value={CARTESIAN.y}  unit="km"   />
          <Field symbol="z"  value={CARTESIAN.z}  unit="km"   />

          <SectionLabel>Velocity (ECI)</SectionLabel>
          <Field symbol="vx" value={CARTESIAN.vx} unit="km/s" />
          <Field symbol="vy" value={CARTESIAN.vy} unit="km/s" />
          <Field symbol="vz" value={CARTESIAN.vz} unit="km/s" />

          <SectionLabel>Derived</SectionLabel>
          <Field symbol="|r|" label="Distance from Earth" value={CARTESIAN.r} unit="km"   />
          <Field symbol="|v|" label="Speed"               value={CARTESIAN.v} unit="km/s" />
        </section>

      </main>
    </div>
  );
}