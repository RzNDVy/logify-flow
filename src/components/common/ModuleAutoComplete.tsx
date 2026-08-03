import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown, Check, Sparkles } from "lucide-react";

interface ModuleAutoCompleteProps {
  value: string;
  onChange: (val: string) => void;
  modules: string[];
  placeholder?: string;
  required?: boolean;
}

export function ModuleAutoComplete({
  value,
  onChange,
  modules,
  placeholder = "Contoh: RFQ, Fleet, Auth...",
  required,
}: ModuleAutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter modules based on user typing
  const filtered = modules.filter((m) =>
    m.toLowerCase().includes((value || "").toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          id="module"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
          className="pr-8"
        />
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Clean Custom Auto-complete Dropdown */}
      {open && (filtered.length > 0 || (value.trim() && !modules.includes(value.trim()))) && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg font-sans">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b mb-1">
            <span>Rekomendasi Modul Database</span>
            <span className="font-mono text-[9px] font-semibold text-primary">{filtered.length} ditemukan</span>
          </div>

          {filtered.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                onChange(m);
                setOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between hover:bg-primary/10 hover:text-primary ${
                value === m ? "bg-primary/15 text-primary font-semibold" : "text-foreground"
              }`}
            >
              <span>{m}</span>
              {value === m && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          ))}

          {/* New module prompt indicator */}
          {value.trim() && !modules.includes(value.trim()) && (
            <div className="px-2.5 py-1.5 text-xs text-muted-foreground border-t mt-1 flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Modul baru: <strong className="text-foreground">"{value.trim()}"</strong> akan otomatis disimpan saat dikirim</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
