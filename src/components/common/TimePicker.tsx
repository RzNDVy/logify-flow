import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Check } from "lucide-react";

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (val: string) => void;
  required?: boolean;
}

const PRESETS = [
  { label: "Sekarang", getVal: () => new Date().toTimeString().slice(0, 5) },
  { label: "08:00", getVal: () => "08:00" },
  { label: "10:00", getVal: () => "10:00" },
  { label: "13:00", getVal: () => "13:00" },
  { label: "15:00", getVal: () => "15:00" },
  { label: "17:00", getVal: () => "17:00" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function TimePicker({ value, onChange, required }: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const [currentHour, currentMinute] = value && value.includes(":")
    ? value.split(":")
    : [new Date().toTimeString().slice(0, 2), new Date().toTimeString().slice(3, 5)];

  const handleSelectHour = (h: string) => {
    onChange(`${h}:${currentMinute}`);
  };

  const handleSelectMinute = (m: string) => {
    onChange(`${currentHour}:${m}`);
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
            className="cursor-pointer pr-9 font-mono text-sm font-semibold tracking-wider"
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

      <PopoverContent className="w-72 p-3 font-sans" align="start">
        <div className="space-y-3">
          {/* Header & Quick Presets */}
          <div className="space-y-1.5 border-b pb-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Pilihan Cepat Waktu
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const targetVal = p.getVal();
                const isSelected = value === targetVal;
                return (
                  <Badge
                    key={p.label}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-[11px] px-2 py-0.5 font-medium transition-colors hover:bg-primary/20"
                    onClick={() => {
                      onChange(targetVal);
                      setOpen(false);
                    }}
                  >
                    {p.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Time Picker Columns (Hours & Minutes) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Hours Column */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-center text-muted-foreground uppercase border-b pb-1">
                Jam ({currentHour})
              </div>
              <div className="h-40 overflow-y-auto pr-1 space-y-0.5 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    className={`w-full py-1 text-xs font-mono rounded text-center transition-colors flex items-center justify-between px-2 ${
                      currentHour === h ? "bg-primary text-primary-foreground font-bold shadow-2xs" : "hover:bg-muted"
                    }`}
                  >
                    <span>{h}:00</span>
                    {currentHour === h && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-center text-muted-foreground uppercase border-b pb-1">
                Menit ({currentMinute})
              </div>
              <div className="h-40 overflow-y-auto pr-1 space-y-0.5 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    className={`w-full py-1 text-xs font-mono rounded text-center transition-colors flex items-center justify-between px-2 ${
                      currentMinute === m ? "bg-primary text-primary-foreground font-bold shadow-2xs" : "hover:bg-muted"
                    }`}
                  >
                    <span>:{m}</span>
                    {currentMinute === m && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Select Button */}
          <Button
            size="sm"
            className="w-full h-8 text-xs font-semibold mt-1"
            onClick={() => setOpen(false)}
          >
            Pilih ({value})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
