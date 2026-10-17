import { animate, AnimatePresence, motion, Reorder, useDragControls } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { radii, radiiPath, SHAPE_NAMES } from "../render/kit";
import type { Item, ShapeName } from "../render";
import { hasIcon, loadAllIcons, store } from "./data";
import type { Dict } from "./i18n";

export const spring = { type: "spring", stiffness: 520, damping: 32, mass: 0.9 } as const;
export const bouncy = { type: "spring", stiffness: 380, damping: 18 } as const;

// Glyph
export function Glyph({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  if (name.startsWith("brand:")) {
    const b = store.brand[name.slice(6)];
    return (
      <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        {b && <path d={b.d} fill="currentColor" transform="translate(2.4 2.4) scale(.8)" />}
      </svg>
    );
  }
  return (
    <svg className={className} width={size} height={size} viewBox="0 -960 960 960" aria-hidden="true">
      <path d={store.symbol[name] ?? ""} fill="currentColor" />
    </svg>
  );
}

// Morph
export function Morph({ shape, size = 40, className, spin }: { shape: ShapeName; size?: number; className?: string; spin?: boolean }) {
  const cur = useRef(radii(shape));
  const [d, setD] = useState(() => radiiPath(cur.current, 50, 50, 44));
  useEffect(() => {
    const from = cur.current;
    const to = radii(shape);
    const ctrl = animate(0, 1, {
      ...bouncy,
      onUpdate: (t) => {
        cur.current = from.map((r, i) => r + (to[i] - r) * t);
        setD(radiiPath(cur.current, 50, 50, 44));
      },
    });
    return () => ctrl.stop();
  }, [shape]);
  return (
    <svg className={`${className ?? ""}${spin ? " spinning" : ""}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d={d} fill="currentColor" />
    </svg>
  );
}

export function useCycle<T>(items: T[], ms: number, on = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setI((x) => (x + 1) % items.length), ms);
    return () => clearInterval(t);
  }, [items.length, ms, on]);
  return items[i];
}

// Buttons
export function Button({
  children, icon, kind = "filled", onClick, disabled, title, href,
}: { children?: ReactNode; icon?: string; kind?: "filled" | "tonal" | "text" | "outlined"; onClick?: () => void; disabled?: boolean; title?: string; href?: string }) {
  const content = (
    <>
      {icon && <Glyph name={icon} size={20} />}
      {children && <span>{children}</span>}
    </>
  );
  const props = {
    className: `btn ${kind}${children ? "" : " icon-only"}`,
    whileTap: disabled ? undefined : { scale: 0.92, borderRadius: 14 },
    whileHover: disabled ? undefined : { scale: 1.03 },
    transition: bouncy,
    title,
  };
  if (href) return <motion.a {...props} href={href} target="_blank" rel="noreferrer">{content}</motion.a>;
  return <motion.button {...props} type="button" onClick={onClick} disabled={disabled}>{content}</motion.button>;
}

export function IconButton({ icon, onClick, title, active }: { icon: string; onClick?: () => void; title: string; active?: boolean }) {
  return (
    <motion.button
      type="button"
      className={`icon-btn${active ? " active" : ""}`}
      onClick={onClick}
      title={title}
      aria-label={title}
      whileTap={{ scale: 0.85, borderRadius: 12 }}
      whileHover={{ scale: 1.06 }}
      transition={bouncy}
    >
      <Glyph name={icon} size={22} />
    </motion.button>
  );
}

// Fields
export function Field({
  label, value, onChange, placeholder, multiline, maxLength,
}: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; maxLength?: number }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {multiline ? (
        <textarea value={value} placeholder={placeholder} rows={2} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function Switch({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className="switch-row" onClick={() => onChange(!value)} role="switch" aria-checked={value}>
      <span>{label}</span>
      <span className={`switch${value ? " on" : ""}`}>
        <motion.span className="thumb" layout transition={bouncy}>
          {value && <Glyph name="check" size={16} />}
        </motion.span>
      </span>
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  const id = useMemo(() => Math.random().toString(36).slice(2), []);
  return (
    <div className="segmented" role="radiogroup">
      {options.map(([v, label]) => (
        <button key={v} type="button" role="radio" aria-checked={v === value} className={v === value ? "on" : ""} onClick={() => onChange(v)}>
          {v === value && <motion.span layoutId={`seg-${id}`} className="seg-bg" transition={spring} />}
          <span className="seg-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function ShapePicker({ value, onChange, allowAuto, autoLabel }: { value?: ShapeName; onChange: (v?: ShapeName) => void; allowAuto?: boolean; autoLabel?: string }) {
  return (
    <div className="shapes">
      {allowAuto && (
        <button type="button" className={`shape-opt auto${!value ? " on" : ""}`} onClick={() => onChange(undefined)}>
          {autoLabel}
        </button>
      )}
      {SHAPE_NAMES.map((s) => (
        <motion.button
          key={s}
          type="button"
          title={s}
          className={`shape-opt${value === s ? " on" : ""}`}
          onClick={() => onChange(s)}
          whileTap={{ scale: 0.85 }}
          whileHover={{ rotate: 30 }}
          transition={bouncy}
        >
          <Morph shape={s} size={28} />
        </motion.button>
      ))}
    </div>
  );
}

// Icons
export function IconSelect({ value, onChange, t, prefer }: { value?: string; onChange: (v: string) => void; t: Dict; prefer?: "symbols" | "brands" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button type="button" className="icon-select" onClick={() => setOpen(true)} title={t.icon} whileTap={{ scale: 0.88 }} transition={bouncy}>
        {value ? <Glyph name={value} size={22} /> : <span className="auto-mark">A</span>}
      </motion.button>
      <AnimatePresence>
        {open && <IconPicker t={t} prefer={value?.startsWith("brand:") ? "brands" : prefer ?? "symbols"} onClose={() => setOpen(false)} onPick={(v) => { onChange(v); setOpen(false); }} />}
      </AnimatePresence>
    </>
  );
}

function IconPicker({ onPick, onClose, t, prefer }: { onPick: (v: string) => void; onClose: () => void; t: Dict; prefer: "symbols" | "brands" }) {
  const [tab, setTab] = useState(prefer);
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadAllIcons().then(() => setReady(true));
  }, []);
  const list = useMemo(() => {
    const query = q.trim().toLowerCase().replace(/\s+/g, "_");
    if (tab === "brands") {
      return Object.entries(store.brand)
        .filter(([k, v]) => !query || k.includes(query.replace(/_/g, "")) || v.t.toLowerCase().includes(q.trim().toLowerCase()))
        .slice(0, 180)
        .map(([k, v]) => ["brand:" + k, v.t] as const);
    }
    return Object.keys(store.symbol)
      .filter((k) => !k.endsWith("#fill") && (!query || k.includes(query)))
      .slice(0, 180)
      .map((k) => [k, k.replace(/_/g, " ")] as const);
  }, [tab, q, ready]);
  return (
    <motion.div className="scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="dialog picker"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={spring}
      >
        <div className="picker-head">
          <label className="search">
            <Glyph name="search" size={20} />
            <input autoFocus value={q} placeholder={t.search} onChange={(e) => setQ(e.target.value)} />
          </label>
          <IconButton icon="close" title={t.close} onClick={onClose} />
        </div>
        <Segmented value={tab} onChange={setTab} options={[["symbols", t.symbols], ["brands", t.brands]]} />
        <div className="picker-grid">
          {!ready && list.length < 20 && <div className="picker-empty"><Morph shape="cookie12" size={32} spin /> {t.loadingIcons}</div>}
          {ready && !list.length && <div className="picker-empty">{t.noIcons}</div>}
          {list.map(([name, title]) => (
            <motion.button key={name} type="button" className="picker-cell" title={title} onClick={() => onPick(name)} whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.12 }} transition={bouncy}>
              {hasIcon(name) && <Glyph name={name} size={26} />}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Lists
let keySeq = 0;

function useKeys(n: number) {
  const ref = useRef<string[]>([]);
  while (ref.current.length < n) ref.current.push(`k${keySeq++}`);
  ref.current.length = n;
  return ref;
}

export function ItemList({
  items, onChange, t, max = 8, prefer, fresh,
}: { items: Item[]; onChange: (v: Item[]) => void; t: Dict; max?: number; prefer?: "symbols" | "brands"; fresh: Item }) {
  const keys = useKeys(items.length);
  const byKey = new Map(keys.current.map((k, i) => [k, items[i]]));
  const reorder = (next: string[]) => {
    keys.current = next;
    onChange(next.map((k) => byKey.get(k)!));
  };
  return (
    <div className="item-list">
      <Reorder.Group axis="y" values={keys.current} onReorder={reorder} as="div" className="rows">
        <AnimatePresence initial={false}>
          {keys.current.map((k, i) => (
            <Row key={k} id={k} item={items[i]} t={t} prefer={prefer}
              onChange={(v) => onChange(items.map((x, j) => (j === i ? v : x)))}
              onRemove={() => { keys.current = keys.current.filter((x) => x !== k); onChange(items.filter((_, j) => j !== i)); }}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      {items.length < max && (
        <Button kind="tonal" icon="add" onClick={() => onChange([...items, fresh])}>
          {t.add}
        </Button>
      )}
    </div>
  );
}

function Row({ id, item, onChange, onRemove, t, prefer }: { id: string; item: Item; onChange: (v: Item) => void; onRemove: () => void; t: Dict; prefer?: "symbols" | "brands" }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      as="div"
      className="row"
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={spring}
      whileDrag={{ scale: 1.03, zIndex: 5 }}
    >
      <span className="grip" onPointerDown={(e) => controls.start(e)} title={t.move}>
        <Glyph name="drag_indicator" size={20} />
      </span>
      <IconSelect value={item.icon} onChange={(icon) => onChange({ ...item, icon })} t={t} prefer={prefer} />
      <input className="row-input" value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value })} />
      <IconButton icon="close" title={t.remove} onClick={onRemove} />
    </Reorder.Item>
  );
}

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="sheet-section">
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}
