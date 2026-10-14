import { useEffect, useRef, useState } from 'react';
import { Field } from './components/Field';
import {
  formatNum,
  keplerianToCartesian,
  cartesianToKeplerian,
  type Keplerian,
  type Cartesian,
} from './lib/orbital';
import {
  checkCartesian,
  checkKeplerian,
  type CartesianKey,
  type Issue,
  type KeplerianKey,
} from './lib/validation';

const DECIMALS = {
  a: 0,
  e: 3,
  i: 1,
  raan: 1,
  omega: 1,
  nu: 1,
  x: 1,
  y: 1,
  z: 1,
  vx: 3,
  vy: 3,
  vz: 3,
  r: 1,
  v: 3,
};

const INITIAL_KEPLERIAN = {
  a: 6786,
  e: 0.002,
  i: 51.6,
  raan: 247.0,
  omega: 130.0,
  nu: 332.5,
};

function formatKeplerian(k: Keplerian) {
  return {
    a: formatNum(k.a, DECIMALS.a),
    e: formatNum(k.e, DECIMALS.e),
    i: formatNum(k.i, DECIMALS.i),
    raan: formatNum(k.raan, DECIMALS.raan),
    omega: formatNum(k.omega, DECIMALS.omega),
    nu: formatNum(k.nu, DECIMALS.nu),
  };
}

function formatCartesian(c: Cartesian) {
  return {
    x: formatNum(c.x, DECIMALS.x),
    y: formatNum(c.y, DECIMALS.y),
    z: formatNum(c.z, DECIMALS.z),
    vx: formatNum(c.vx, DECIMALS.vx),
    vy: formatNum(c.vy, DECIMALS.vy),
    vz: formatNum(c.vz, DECIMALS.vz),
    r: formatNum(c.r, DECIMALS.r),
    v: formatNum(c.v, DECIMALS.v),
  };
}

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
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${dot === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`}
        />
        <span className="text-[10px] font-semibold tracking-[0.12em] text-slate-600 uppercase">
          {title}
        </span>
      </div>
      <span data-cy={`badge-${dot}`} className="text-xs text-slate-400">
        {badge}
      </span>
    </div>
  );
}

function IssueList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-1">
      {issues.map((issue) => (
        <li
          key={issue.message}
          data-cy={`issue-${issue.severity}`}
          className={`text-[11px] leading-snug ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}
        >
          {issue.message}
        </li>
      ))}
    </ul>
  );
}

function hasError(issues: Issue[]) {
  return issues.some((issue) => issue.severity === 'error');
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mt-3 mb-1">
      <span className="text-[9px] font-semibold tracking-[0.14em] text-slate-400 uppercase whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

export default function App() {
  const initialCartesian = keplerianToCartesian(INITIAL_KEPLERIAN);

  const [kepStr, setKepStr] = useState(formatKeplerian(INITIAL_KEPLERIAN));

  const [cartStr, setCartStr] = useState(formatCartesian(initialCartesian));

  const [lastEdited, setLastEdited] = useState<'keplerian' | 'cartesian'>(
    'keplerian'
  );

  const [kepIssues, setKepIssues] = useState<Issue<KeplerianKey>[]>([]);
  const [cartIssues, setCartIssues] = useState<Issue<CartesianKey>[]>([]);

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  );
  const copyTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  // the computed panel is out of date while the source panel has errors
  const kepStale = lastEdited === 'cartesian' && hasError(cartIssues);
  const cartStale = lastEdited === 'keplerian' && hasError(kepIssues);

  const kepInvalid = (key: KeplerianKey) =>
    kepIssues.some((i) => i.severity === 'error' && i.fields.includes(key));
  const cartInvalid = (key: CartesianKey) =>
    cartIssues.some((i) => i.severity === 'error' && i.fields.includes(key));

  function handleKeplerianChange(field: KeplerianKey, raw: string) {
    const next = { ...kepStr, [field]: raw };
    setKepStr(next);
    setLastEdited('keplerian');

    const { values, issues } = checkKeplerian(next);
    setKepIssues(issues);
    setCartIssues([]);
    if (!values) return;

    setCartStr(formatCartesian(keplerianToCartesian(values)));
  }

  function handleCartesianChange(field: CartesianKey, raw: string) {
    const next = { ...cartStr, [field]: raw };
    setCartStr(next);
    setLastEdited('cartesian');

    const { values, issues } = checkCartesian(next);
    setCartIssues(issues);
    setKepIssues([]);
    if (!values) return;

    const kep = cartesianToKeplerian(values);
    const r = Math.sqrt(values.x ** 2 + values.y ** 2 + values.z ** 2);
    const v = Math.sqrt(values.vx ** 2 + values.vy ** 2 + values.vz ** 2);

    setCartStr({
      ...next,
      r: formatNum(r, DECIMALS.r),
      v: formatNum(v, DECIMALS.v),
    });
    setKepStr(formatKeplerian(kep));
  }

  function handleReset() {
    setKepStr(formatKeplerian(INITIAL_KEPLERIAN));
    setCartStr(formatCartesian(keplerianToCartesian(INITIAL_KEPLERIAN)));
    setLastEdited('keplerian');
    setKepIssues([]);
    setCartIssues([]);
  }

  async function handleCopyJSON() {
    const payload = {
      keplerian: kepStr,
      cartesian: cartStr,
      source: lastEdited,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyStatus('copied');
    } catch {
      // clipboard is unavailable (e.g. not https) or permission was denied
      setCopyStatus('failed');
    }
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyStatus('idle'), 1500);
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* header */}
      <header className="border-b border-slate-200 bg-white shrink-0">
        <div className="w-[900px] mx-auto flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold text-slate-800 tracking-tight">
              Orbital element converter
            </h1>
            <span className="text-xs text-blue-500 border border-blue-200 bg-blue-50 rounded-full px-2.5 py-0.5">
              Keplerian ↔ Cartesian
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-cy="reset"
              onClick={handleReset}
              className="text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
            >
              ↺ Reset
            </button>
            <div className="relative">
              <button
                data-cy="copy-json"
                onClick={() => void handleCopyJSON()}
                className="text-xs text-slate-500 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
              >
                ⧉ Copy JSON
              </button>
              <div role="status" aria-live="polite">
                {copyStatus !== 'idle' && (
                  <span
                    data-cy="copy-tooltip"
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium text-white shadow-md
                      before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent
                      ${copyStatus === 'copied' ? 'bg-slate-800 before:border-b-slate-800' : 'bg-red-600 before:border-b-red-600'}`}
                  >
                    {copyStatus === 'copied' ? '✓ Copied' : "Couldn't copy"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* panels */}
      <main className="flex flex-1 min-h-0 items-center justify-center px-8 py-6">
        <div className="flex items-center gap-6">
          {/* keplerian */}
          <section
            data-cy="panel-keplerian"
            className={`transition-opacity ${kepStale ? 'opacity-50' : ''} w-100 shrink-0 flex flex-col bg-white rounded-xl shadow-sm shadow-slate-200/60 border border-slate-100 px-5 py-4`}
          >
            <PanelHeader
              dot="blue"
              title="Keplerian elements"
              badge={
                lastEdited === 'keplerian'
                  ? 'source'
                  : kepStale
                    ? 'not updated'
                    : 'computed'
              }
            />

            <SectionDivider label="Shape" />
            <Field
              name="a"
              symbol="a"
              label="Semi-major axis"
              value={kepStr.a}
              unit="km"
              invalid={kepInvalid('a')}
              onChange={(v) => handleKeplerianChange('a', v)}
            />
            <Field
              name="e"
              symbol="e"
              label="Eccentricity"
              value={kepStr.e}
              unit="—"
              invalid={kepInvalid('e')}
              onChange={(v) => handleKeplerianChange('e', v)}
            />

            <SectionDivider label="Orientation" />
            <Field
              name="i"
              symbol="i"
              label="Inclination"
              value={kepStr.i}
              unit="deg"
              invalid={kepInvalid('i')}
              onChange={(v) => handleKeplerianChange('i', v)}
            />
            <Field
              name="raan"
              symbol="Ω"
              label="RAAN"
              value={kepStr.raan}
              unit="deg"
              invalid={kepInvalid('raan')}
              onChange={(v) => handleKeplerianChange('raan', v)}
            />
            <Field
              name="omega"
              symbol="ω"
              label="Arg. of periapsis"
              value={kepStr.omega}
              unit="deg"
              invalid={kepInvalid('omega')}
              onChange={(v) => handleKeplerianChange('omega', v)}
            />

            <SectionDivider label="Position" />
            <Field
              name="nu"
              symbol="ν"
              label="True anomaly"
              value={kepStr.nu}
              unit="deg"
              invalid={kepInvalid('nu')}
              onChange={(v) => handleKeplerianChange('nu', v)}
            />
            <IssueList issues={kepIssues} />
          </section>

          {/* exchange */}
          <div className="flex items-center justify-center w-8 shrink-0">
            <span
              className={`text-xl font-bold select-none transition-colors duration-300 ${
                lastEdited === 'keplerian'
                  ? 'text-blue-500'
                  : 'text-emerald-500'
              }`}
            >
              {lastEdited === 'keplerian' ? '→' : '←'}
            </span>
          </div>

          {/* cartesian */}
          <section
            data-cy="panel-cartesian"
            className={`transition-opacity ${cartStale ? 'opacity-50' : ''} w-100 shrink-0 flex flex-col bg-white rounded-xl shadow-sm shadow-slate-200/60 border border-slate-100 px-5 py-4`}
          >
            <PanelHeader
              dot="green"
              title="Cartesian state vector"
              badge={
                lastEdited === 'cartesian'
                  ? 'source'
                  : cartStale
                    ? 'not updated'
                    : 'computed'
              }
            />

            <SectionDivider label="Position (ECI)" />
            <Field
              name="x"
              symbol="x"
              value={cartStr.x}
              unit="km"
              invalid={cartInvalid('x')}
              onChange={(v) => handleCartesianChange('x', v)}
            />
            <Field
              name="y"
              symbol="y"
              value={cartStr.y}
              unit="km"
              invalid={cartInvalid('y')}
              onChange={(v) => handleCartesianChange('y', v)}
            />
            <Field
              name="z"
              symbol="z"
              value={cartStr.z}
              unit="km"
              invalid={cartInvalid('z')}
              onChange={(v) => handleCartesianChange('z', v)}
            />

            <SectionDivider label="Velocity (ECI)" />
            <Field
              name="vx"
              symbol="vx"
              value={cartStr.vx}
              unit="km/s"
              invalid={cartInvalid('vx')}
              onChange={(v) => handleCartesianChange('vx', v)}
            />
            <Field
              name="vy"
              symbol="vy"
              value={cartStr.vy}
              unit="km/s"
              invalid={cartInvalid('vy')}
              onChange={(v) => handleCartesianChange('vy', v)}
            />
            <Field
              name="vz"
              symbol="vz"
              value={cartStr.vz}
              unit="km/s"
              invalid={cartInvalid('vz')}
              onChange={(v) => handleCartesianChange('vz', v)}
            />

            <SectionDivider label="Derived" />
            <Field
              name="r"
              symbol="|r|"
              label="Distance from Earth"
              value={cartStr.r}
              unit="km"
              readOnly
            />
            <Field
              name="v"
              symbol="|v|"
              label="Speed"
              value={cartStr.v}
              unit="km/s"
              readOnly
            />
            <IssueList issues={cartIssues} />
          </section>
        </div>
      </main>
    </div>
  );
}
