import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles } from "lucide-react";

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (val: string) => void;
  required?: boolean;
}

const PRESETS = [
  { label: "⚡ Sekarang", getVal: () => new Date().toTimeString().slice(0, 5) },
  { label: "🌅 08:00", getVal: () => "08:00" },
  { label: "🍱 12:00", getVal: () => "12:00" },
  { label: "☕ 15:00", getVal: () => "15:00" },
  { label: "🏠 17:00", getVal: () => "17:00" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

// Helper to determine time of day badge
function getTimeOfDayBadge(hourStr: string) {
  const h = parseInt(hourStr, 10);
  if (h >= 0 && h < 6) return { label: "🌙 Dini Hari", className: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" };
  if (h >= 6 && h < 11) return { label: "🌅 Pagi", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
  if (h >= 11 && h < 15) return { label: "☀️ Siang", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
  if (h >= 15 && h < 19) return { label: "🌇 Sore", className: "bg-rose-500/10 text-rose-500 border-rose-500/20" };
  return { label: "🌙 Malam", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
}

export function TimePicker({ value, onChange, required }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const [currentHour, currentMinute] = value && value.includes(":")
    ? value.split(":")
    : [new Date().toTimeString().slice(0, 2), new Date().toTimeString().slice(3, 5)];

  const timeOfDay = getTimeOfDayBadge(currentHour);

  const handleSelectHour = (h: string) => {
    onChange(`${h}:${currentMinute}`);
  };

  const handleSelectMinute = (m: string) => {
    onChange(`${currentHour}:${m}`);
  };

  const handlePresetSelect = (presetVal: string) => {
    onChange(presetVal);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer">
          <Input
            id="time"
            value={value}
            readOnly
            onClick={() => setOpen(true)}
            placeholder="HH:mm"
            required={required}
            className="cursor-pointer pr-9 font-mono text-sm font-bold tracking-wider hover:border-primary/50 transition-colors shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Clock className="h-4 w-4 text-primary" />
          </button>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-4 font-sans rounded-2xl shadow-xl border border-border/80 bg-background/95 backdrop-blur-md" align="start">
        <div className="space-y-3.5">
          {/* Digital Clock Banner Display */}
          <div className="relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-3.5 border border-primary/20">
            <Badge variant="outline" className={`text-[10px] font-semibold mb-1.5 px-2 py-0.5 ${timeOfDay.className}`}>
              {timeOfDay.label}
            </Badge>

            <div className="flex items-center gap-1.5 font-mono text-3xl font-black text-foreground tracking-tight">
              <span className="bg-background px-2.5 py-1 rounded-lg border shadow-xs text-primary">{currentHour}</span>
              <span className="text-primary/60 animate-pulse">:</span>
              <span className="bg-background px-2.5 py-1 rounded-lg border shadow-xs text-primary">{currentMinute}</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" /> Pilihan Cepat Waktu
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const targetVal = p.getVal();
                const isSelected = value === targetVal;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePresetSelect(targetVal)}
                    className={`cursor-pointer text-[11px] px-2.5 py-1 rounded-full font-medium transition-all border ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-xs border-primary"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border-border/60"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker Wheel Columns (Hours & Minutes) */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t">
            {/* Hours Column */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-center text-muted-foreground uppercase pb-1">
                Jam ({currentHour})
              </div>
              <div
                onWheel={(e) => e.stopPropagation()}
                className="h-44 overflow-y-auto space-y-1 pr-1.5 touch-pan-y overscroll-contain [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary)/0.5)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-primary/10 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary"
              >
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    className={`w-full py-1.5 text-xs font-mono rounded-lg text-center transition-all flex items-center justify-center font-bold ${
                      currentHour === h
                        ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {h}:00
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-center text-muted-foreground uppercase pb-1">
                Menit ({currentMinute})
              </div>
              <div
                onWheel={(e) => e.stopPropagation()}
                className="h-44 overflow-y-auto space-y-1 pr-1.5 touch-pan-y overscroll-contain [scrollbar-width:thin] [scrollbar-color:hsl(var(--primary)/0.5)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-primary/10 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-primary"
              >
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    className={`w-full py-1.5 text-xs font-mono rounded-lg text-center transition-all flex items-center justify-center font-bold ${
                      currentMinute === m
                        ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Select Action Button */}
          <Button
            size="sm"
            className="w-full h-9 text-xs font-bold shadow-sm rounded-xl gap-1"
            onClick={() => setOpen(false)}
          >
            Set Waktu ({value})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
