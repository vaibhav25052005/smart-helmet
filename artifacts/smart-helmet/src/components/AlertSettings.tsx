import { useState } from "react";
import { Settings, X, Bell, BellOff, Volume2, VolumeX, HardHat, FlaskConical, Eye, SlidersHorizontal, Send } from "lucide-react";

export interface AlertConfig {
  helmetAlert: boolean;
  alcoholAlert: boolean;
  drowsyAlert: boolean;
  audioEnabled: boolean;
  visualAlerts: boolean;
  autoAlert: boolean;
  mq3Threshold: number;
}

export const defaultAlertConfig: AlertConfig = {
  helmetAlert: true,
  alcoholAlert: true,
  drowsyAlert: true,
  audioEnabled: true,
  visualAlerts: true,
  autoAlert: false,
  mq3Threshold: 400,
};

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  dangerColor?: boolean;
}

function ToggleRow({ icon, label, description, checked, onChange, dangerColor }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${checked ? (dangerColor ? "bg-red-900/50" : "bg-cyan-900/50") : "bg-slate-700/50"}`}>
          <div className={checked ? (dangerColor ? "text-red-400" : "text-cyan-400") : "text-slate-500"}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
            checked ? (dangerColor ? "bg-red-500" : "bg-cyan-500") : "bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

interface AlertSettingsProps {
  config: AlertConfig;
  onChange: (config: AlertConfig) => void;
  onTestSound?: (type: "helmet" | "alcohol" | "drowsy" | "distance") => void;
}

export function AlertSettings({ config, onChange, onTestSound }: AlertSettingsProps) {
  const [open, setOpen] = useState(false);

  const update = (key: keyof AlertConfig, value: boolean | number) => {
    onChange({ ...config, [key]: value });
  };

  const activeCount = [config.helmetAlert, config.alcoholAlert, config.drowsyAlert].filter(Boolean).length;

  return (
    <>
      {/* Settings trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-200"
      >
        <Settings className="w-4 h-4" />
        Alert Settings
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-900/40">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Alert Settings</h2>
                  <p className="text-xs text-slate-500">Configure dashboard notifications</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-2">
              {/* Section: Alert Types */}
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-3 mb-1">Alert Types</p>
              <div className="relative">
                <ToggleRow
                  icon={<HardHat className="w-4 h-4" />}
                  label="Helmet Alert"
                  description="Alert when helmet is not worn"
                  checked={config.helmetAlert}
                  onChange={(v) => update("helmetAlert", v)}
                  dangerColor
                />
                {onTestSound && (
                  <button onClick={() => onTestSound("helmet")} className="absolute right-14 top-4 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white text-[10px] font-bold">TEST</button>
                )}
              </div>
              <div className="relative">
                <ToggleRow
                  icon={<FlaskConical className="w-4 h-4" />}
                  label="Alcohol Alert"
                  description="Alert when alcohol is detected"
                  checked={config.alcoholAlert}
                  onChange={(v) => update("alcoholAlert", v)}
                  dangerColor
                />
                {onTestSound && (
                  <button onClick={() => onTestSound("alcohol")} className="absolute right-14 top-4 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white text-[10px] font-bold">TEST</button>
                )}
              </div>
              <div className="relative">
                <ToggleRow
                  icon={<Eye className="w-4 h-4" />}
                  label="Drowsiness Alert"
                  description="Alert when drowsiness is detected"
                  checked={config.drowsyAlert}
                  onChange={(v) => update("drowsyAlert", v)}
                  dangerColor
                />
                {onTestSound && (
                  <button onClick={() => onTestSound("drowsy")} className="absolute right-14 top-4 p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white text-[10px] font-bold">TEST</button>
                )}
              </div>

              {/* Section: Audio */}
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-5 mb-1">Audio</p>
              <ToggleRow
                icon={config.audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                label="Sound Alerts"
                description="Play buzzer sound on danger events"
                checked={config.audioEnabled}
                onChange={(v) => update("audioEnabled", v)}
              />
              <ToggleRow
                icon={<Bell className="w-4 h-4" />}
                label="Visual Alerts"
                description="Show pop-up notifications on dashboard"
                checked={config.visualAlerts}
                onChange={(v) => update("visualAlerts", v)}
              />
              <ToggleRow
                icon={<Send className="w-4 h-4" />}
                label="Automatic SMS"
                description="Background SMS after 5s of danger"
                checked={config.autoAlert}
                onChange={(v) => update("autoAlert", v)}
              />

              {/* Section: Thresholds */}
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-5 mb-3">Thresholds</p>
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">MQ3 Alcohol Threshold</p>
                    <p className="text-xs text-slate-500">Raw sensor value trigger point</p>
                  </div>
                  <span className="text-lg font-black text-cyan-400 tabular-nums w-14 text-right">
                    {config.mq3Threshold}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={900}
                  step={10}
                  value={config.mq3Threshold}
                  onChange={(e) => update("mq3Threshold", Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-slate-700 accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>50 (Sensitive)</span>
                  <span>900 (High)</span>
                </div>
              </div>

              {/* Summary */}
              <div className={`mt-4 mb-5 rounded-xl px-4 py-3 border text-xs flex items-start gap-2 ${
                activeCount === 0
                  ? "bg-slate-800/50 border-slate-700/40 text-slate-500"
                  : "bg-cyan-950/40 border-cyan-800/40 text-cyan-400"
              }`}>
                {config.audioEnabled ? (
                  <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                )}
                <span>
                  {activeCount === 0
                    ? "All alerts are disabled. No notifications will appear."
                    : `${activeCount} alert type${activeCount > 1 ? "s" : ""} active${config.audioEnabled ? " with audio" : " (silent mode)"}. MQ3 threshold: ${config.mq3Threshold}.`}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-700/60 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold transition-colors"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
