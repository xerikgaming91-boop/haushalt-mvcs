import React, { useEffect, useMemo, useRef, useState } from "react";

export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Auswählen…",
  emptyText = "Keine Treffer",
  disabled = false,
  allowClear = true,
  className = "",
  style
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(() => options.find((o) => String(o.value) === String(value)) || null, [options, value]);

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.label || "").toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    function onDocDown(e) {
      if (!open) return;
      if (!rootRef.current) return;
      if (rootRef.current.contains(e.target)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  // Keep active index valid
  useEffect(() => {
    if (!open) return;
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [open, filtered.length, activeIndex]);

  function openMenu() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  function selectOption(opt) {
    onChange?.(opt.value);
    closeMenu();
  }

  const displayValue = open ? query : selected?.label || "";

  return (
    <div ref={rootRef} className={"ssWrap " + className} style={style}>
      <div className={"ssControl " + (disabled ? "disabled" : "")}>
        <input
          ref={inputRef}
          className="ssInput"
          disabled={disabled}
          readOnly={!open}
          value={displayValue || (!open ? "" : "")}
          placeholder={!selected ? placeholder : open ? placeholder : selected.label}
          onClick={() => {
            if (!open) openMenu();
          }}
          onFocus={() => {
            if (!open) openMenu();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            if (!open) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (disabled) return;

            if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
              e.preventDefault();
              openMenu();
              return;
            }

            if (!open) return;

            if (e.key === "Escape") {
              e.preventDefault();
              closeMenu();
              return;
            }

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
              return;
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
              return;
            }

            if (e.key === "Enter") {
              e.preventDefault();
              const opt = filtered[activeIndex];
              if (opt) selectOption(opt);
              return;
            }
          }}
        />

        {allowClear && !disabled && value ? (
          <button
            type="button"
            className="ssBtn ssClear"
            title="Auswahl löschen"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange?.("");
              closeMenu();
            }}
          >
            ×
          </button>
        ) : null}

        <button
          type="button"
          className="ssBtn"
          title={open ? "Schließen" : "Öffnen"}
          disabled={disabled}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (open) closeMenu();
            else openMenu();
          }}
        >
          ▾
        </button>
      </div>

      {open && !disabled && (
        <div className="ssMenu" role="listbox" aria-label="Auswahl">
          {filtered.length === 0 ? (
            <div className="ssEmpty">{emptyText}</div>
          ) : (
            filtered.map((opt, idx) => {
              const isActive = idx === activeIndex;
              const isSelected = selected && String(selected.value) === String(opt.value);
              return (
                <div
                  key={String(opt.value)}
                  className={"ssOption " + (isActive ? "active" : "") + (isSelected ? " selected" : "")}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    // use mousedown to prevent input blur before select
                    e.preventDefault();
                    selectOption(opt);
                  }}
                >
                  <div className="ssLabel">{opt.label}</div>
                  {opt.subLabel ? <div className="ssSub">{opt.subLabel}</div> : null}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
