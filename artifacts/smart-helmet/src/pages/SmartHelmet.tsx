import { useState, useCallback, useEffect, useRef } from "react";
import { useWifi, HelmetData } from "@/hooks/useWifi";
import { useAudioBuzzer } from "@/hooks/useAudioBuzzer";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "@/hooks/useTheme";
import { AlertSettings, AlertConfig, defaultAlertConfig } from "@/components/AlertSettings";
import { NotificationPanel } from "@/components/NotificationPanel";
import { RulesPanel } from "@/components/RulesPanel";
import {
  Wifi, WifiOff, HardHat, FlaskConical, Eye, Zap, AlertTriangle,
  Activity, Clock, Plug, PlugZap, Lightbulb, Bell, Ruler, Signal,
  Sun, Moon,
} from "lucide-react";

const initialData: HelmetData = {
  helmetWorn: null, alcoholDetected: null, alcoholValue: null, drowsy: null,
  motorOn: null, ledOn: null, buzzerOn: null, distance: null, rssi: null, lastUpdated: null,
};

type CardStatus = "safe" | "danger" | "unknown";

interface StatusCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  status: CardStatus;
  sub?: string;
  blinking?: boolean;
}

function StatusCard({ icon, label, value, status, sub, blinking }: StatusCardProps) {
  const base = {
    safe: {
      wrap: "helmet-card-safe bg-emerald-950/50 border border-emerald-700/60 shadow-[0_0_20px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/30",
      iconBg: "helmet-card-icon-bg bg-emerald-900/60",
      iconColor: "text-emerald-400",
      dot: "bg-emerald-400",
      value: "helmet-card-value text-emerald-300",
    },
    danger: {
      wrap: "helmet-card-danger bg-red-950/50 border border-red-700/60 shadow-[0_0_20px_rgba(248,113,113,0.2)] ring-1 ring-red-500/30",
      iconBg: "helmet-card-icon-bg bg-red-900/60",
      iconColor: "text-red-400",
      dot: "bg-red-400",
      value: "helmet-card-value text-red-300",
    },
    unknown: {
      wrap: "helmet-card-unknown bg-slate-800/50 border border-slate-600/40 ring-1 ring-slate-500/20",
      iconBg: "helmet-card-icon-bg bg-slate-700/60",
      iconColor: "text-slate-400",
      dot: "bg-slate-500",
      value: "helmet-card-value text-slate-400",
    },
  }[status];

  return (
    <div className={`relative rounded-2xl p-5 transition-all duration-500 ${base.wrap}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${base.iconBg}`}>
          <div className={base.iconColor}>{icon}</div>
        </div>
        <div className="relative flex items-center">
          {status !== "unknown" && (
            <span className={`absolute inset-0 rounded-full ${base.dot} opacity-40 pulse-ring`} />
          )}
          <span className={`relative w-3 h-3 rounded-full ${base.dot} ${blinking && status === "danger" ? "blink-danger" : ""}`} />
        </div>
      </div>
      <p className="helmet-text-label text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold transition-all duration-300 ${base.value}`}>{value ?? "—"}</p>
      {sub && <p className="helmet-card-sub helmet-text-muted text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function AlertBanner({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <div className="helmet-danger-banner rounded-xl border border-red-700/60 bg-red-950/50 p-4 ring-1 ring-red-500/20 shadow-[0_0_30px_rgba(248,113,113,0.15)]">
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-red-900/60 shrink-0 blink-danger">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="font-bold text-red-300 text-sm uppercase tracking-wide mb-1">Danger Detected</p>
          <ul className="space-y-0.5">
            {messages.map((m, i) => (
              <li key={i} className="text-sm text-red-400 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SmartHelmet() {
  const { theme, toggle: toggleTheme } = useTheme();
  const [data, setData] = useState<HelmetData>(initialData);
  const [ip, setIp] = useState("192.168.1.100");
  const [port, setPort] = useState("81");
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(defaultAlertConfig);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const { playAlert } = useAudioBuzzer();
  const { permission, requestPermission, notifications, addNotification, markAllRead, clearAll, unreadCount } = useNotifications();

  const prevDangerRef = useRef({ helmet: false, alcohol: false, drowsy: false, distance: false });
  const audioUnlockedRef = useRef(false);

  const handleData = useCallback((incoming: Partial<HelmetData>) => {
    setData((prev) => ({ ...prev, ...incoming }));
  }, []);

  const { status, error, connect, disconnect } = useWifi(handleData);
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const handleConnect = () => {
    audioUnlockedRef.current = true;
    connect(ip.trim(), port.trim());
  };

  const alcoholDangerByThreshold = data.alcoholValue != null && data.alcoholValue > alertConfig.mq3Threshold;
  const effectiveAlcoholDetected = data.alcoholDetected === true || alcoholDangerByThreshold;
  const distanceDanger = data.distance != null && data.distance < 20;

  useEffect(() => {
    const helmetDanger = alertConfig.helmetAlert && data.helmetWorn === false;
    const alcoholDanger = alertConfig.alcoholAlert && effectiveAlcoholDetected;
    const drowsyDanger = alertConfig.drowsyAlert && data.drowsy === true;

    if (audioUnlockedRef.current && alertConfig.audioEnabled) {
      if (helmetDanger && !prevDangerRef.current.helmet) playAlert("helmet");
      if (alcoholDanger && !prevDangerRef.current.alcohol) playAlert("alcohol");
      if (drowsyDanger && !prevDangerRef.current.drowsy) playAlert("drowsy");
      if (distanceDanger && !prevDangerRef.current.distance) playAlert("distance");
    }

    if (helmetDanger && !prevDangerRef.current.helmet)
      addNotification("Helmet Rule Violated", "Rider is not wearing the helmet. Motor may be disabled.", "danger");
    if (alcoholDanger && !prevDangerRef.current.alcohol)
      addNotification("Alcohol Detected", `MQ3: ${data.alcoholValue ?? "—"}, limit: ${alertConfig.mq3Threshold}. Do not operate the motor.`, "danger");
    if (drowsyDanger && !prevDangerRef.current.drowsy)
      addNotification("Drowsiness Detected", "Rider appears to be drowsy. Stop immediately and rest.", "danger");
    if (distanceDanger && !prevDangerRef.current.distance)
      addNotification("Obstacle Too Close", `Distance: ${data.distance?.toFixed(1) ?? "—"} cm. Obstacle detected!`, "warning");

    prevDangerRef.current = { helmet: helmetDanger, alcohol: alcoholDanger, drowsy: drowsyDanger, distance: distanceDanger };
  }, [data.helmetWorn, effectiveAlcoholDetected, data.drowsy, distanceDanger, data.alcoholValue, data.distance, alertConfig, playAlert, addNotification]);

  const dangerMessages: string[] = [];
  if (alertConfig.helmetAlert && data.helmetWorn === false) dangerMessages.push("Helmet not worn — rider at risk!");
  if (alertConfig.alcoholAlert && effectiveAlcoholDetected) dangerMessages.push("Alcohol detected — do not operate motor!");
  if (alertConfig.drowsyAlert && data.drowsy === true) dangerMessages.push("Drowsiness detected — stop and rest!");
  if (distanceDanger) dangerMessages.push(`Obstacle ahead — ${data.distance?.toFixed(1)} cm away!`);

  const getStatus = (val: boolean | null, safeWhen: boolean): CardStatus => {
    if (val === null) return "unknown";
    return val === safeWhen ? "safe" : "danger";
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300" onClick={() => { audioUnlockedRef.current = true; }}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="relative text-center space-y-2">
          {/* Theme toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
            className="helmet-btn-secondary absolute right-0 top-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-200"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span className="text-xs hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-cyan-900/40 ring-1 ring-cyan-500/30">
              <HardHat className="w-7 h-7 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Smart Helmet <span className="text-cyan-500">System</span>
            </h1>
          </div>
          <p className="helmet-text-secondary text-slate-400 text-sm">Real-time safety monitoring via WiFi</p>
        </div>

        {/* Connection Panel */}
        <div className="helmet-surface rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-slate-400 helmet-text-secondary" />
            <span className="helmet-text-secondary text-sm font-semibold text-slate-300 uppercase tracking-wider">WiFi Connection</span>
            {isConnected && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 blink-danger" />
                LIVE
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="helmet-text-muted text-xs text-slate-500 mb-1 block">ESP32 IP Address</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                disabled={isConnected || isConnecting}
                placeholder="192.168.1.100"
                className="helmet-input w-full rounded-xl border border-slate-600/60 bg-slate-700/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 font-mono"
              />
            </div>
            <div className="w-24">
              <label className="helmet-text-muted text-xs text-slate-500 mb-1 block">Port</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                disabled={isConnected || isConnecting}
                placeholder="81"
                className="helmet-input w-full rounded-xl border border-slate-600/60 bg-slate-700/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isConnected ? "bg-emerald-900/50" : "helmet-icon-bg bg-slate-700/50"}`}>
                {isConnected
                  ? <PlugZap className="w-5 h-5 text-emerald-400" />
                  : <Plug className="w-5 h-5 text-slate-400 helmet-text-secondary" />}
              </div>
              <div>
                <p className="helmet-text-primary font-semibold text-sm text-white">
                  {isConnected ? `${ip}:${port}` : isConnecting ? "Connecting…" : status === "error" ? "Connection Failed" : "Not Connected"}
                </p>
                <p className="helmet-text-muted text-xs text-slate-500">
                  {isConnected ? "WebSocket • Receiving data" : "WebSocket over WiFi"}
                </p>
              </div>
            </div>
            <button
              onClick={isConnected ? disconnect : handleConnect}
              disabled={isConnecting || (!isConnected && !ip.trim())}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${isConnected
                  ? "helmet-btn-secondary bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
                  : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]"}`}
            >
              {isConnected ? <><WifiOff className="w-4 h-4" /> Disconnect</>
                : isConnecting ? <><Wifi className="w-4 h-4 animate-pulse" /> Connecting…</>
                : <><Wifi className="w-4 h-4" /> Connect WiFi</>}
            </button>
          </div>

          {error === "HTTPS_BLOCK" && (
            <div className="bg-amber-950/50 border border-amber-700/60 rounded-xl px-4 py-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <span>⚠️</span>
                <span>Browser is blocking the connection (HTTPS → ws://)</span>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                This page is served over <strong>HTTPS</strong>, so the browser automatically blocks unencrypted
                WebSocket connections (<code className="bg-black/30 px-1 rounded">ws://</code>) to your ESP32.
                Fix it in <strong>one of these two ways:</strong>
              </p>
              <div className="text-xs text-amber-100/90 space-y-2 pl-1">
                <div>
                  <p className="font-semibold text-amber-300 mb-0.5">Option 1 — Allow mixed content in Chrome (easiest)</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-amber-200/80 pl-1">
                    <li>Click the <strong>lock icon</strong> in the address bar</li>
                    <li>Click <strong>Site settings</strong></li>
                    <li>Find <strong>Insecure content</strong> → change to <strong>Allow</strong></li>
                    <li>Refresh the page and connect again</li>
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-amber-300 mb-0.5">Option 2 — Open the app over HTTP (most reliable)</p>
                  <ol className="list-decimal list-inside space-y-0.5 text-amber-200/80 pl-1">
                    <li>Find the ESP32 IP address in Arduino Serial Monitor</li>
                    <li>Open the ESP32 IP in your browser: <code className="bg-black/30 px-1 rounded">http://&lt;ESP32-IP&gt;/</code></li>
                    <li>Or run the app locally via <code className="bg-black/30 px-1 rounded">http://</code> instead of <code className="bg-black/30 px-1 rounded">https://</code></li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          {error && error !== "HTTPS_BLOCK" && (
            <div className="text-xs text-red-400 bg-red-950/40 rounded-lg px-3 py-2 border border-red-800/40">{error}</div>
          )}
          {isConnected && data.lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs helmet-text-muted text-slate-500">
              <Clock className="w-3 h-3" />
              Last update: {data.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            {isConnected && <AlertBanner messages={dangerMessages} />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RulesPanel open={rulesOpen} onOpenChange={setRulesOpen} />
            <NotificationPanel
              notifications={notifications}
              unreadCount={unreadCount}
              permission={permission}
              onRequestPermission={requestPermission}
              onMarkAllRead={markAllRead}
              onClearAll={clearAll}
              open={notifPanelOpen}
              onOpenChange={(v) => { setNotifPanelOpen(v); if (v) markAllRead(); }}
            />
            <AlertSettings config={alertConfig} onChange={setAlertConfig} />
          </div>
        </div>

        {/* Safety Status */}
        <div>
          <p className="helmet-section-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Safety Status</p>
          <div className="grid grid-cols-2 gap-4">
            <StatusCard
              icon={<HardHat className="w-5 h-5" />}
              label="Helmet Status"
              value={data.helmetWorn === null ? null : data.helmetWorn ? "Worn" : "Not Worn"}
              status={getStatus(data.helmetWorn, true)}
              blinking={alertConfig.helmetAlert && data.helmetWorn === false}
            />
            <StatusCard
              icon={<FlaskConical className="w-5 h-5" />}
              label="Alcohol Status"
              value={data.alcoholDetected === null ? null : effectiveAlcoholDetected ? "Detected" : "Safe"}
              status={effectiveAlcoholDetected ? "danger" : data.alcoholDetected === null ? "unknown" : "safe"}
              sub={data.alcoholValue != null ? `MQ3: ${data.alcoholValue} / limit: ${alertConfig.mq3Threshold}` : undefined}
              blinking={alertConfig.alcoholAlert && effectiveAlcoholDetected}
            />
            <StatusCard
              icon={<Eye className="w-5 h-5" />}
              label="Drowsiness"
              value={data.drowsy === null ? null : data.drowsy ? "Sleep" : "Awake"}
              status={getStatus(data.drowsy, false)}
              blinking={alertConfig.drowsyAlert && data.drowsy === true}
            />
            <StatusCard
              icon={<Zap className="w-5 h-5" />}
              label="Motor Status"
              value={data.motorOn === null ? null : data.motorOn ? "ON" : "OFF"}
              status={data.motorOn === null ? "unknown" : data.motorOn ? "safe" : "unknown"}
            />
          </div>
        </div>

        {/* Hardware Status */}
        <div>
          <p className="helmet-section-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Hardware Status</p>
          <div className="grid grid-cols-2 gap-4">
            <StatusCard
              icon={<Lightbulb className="w-5 h-5" />}
              label="LED Status"
              value={data.ledOn === null ? null : data.ledOn ? "ON" : "OFF"}
              status={data.ledOn === null ? "unknown" : data.ledOn ? "safe" : "unknown"}
            />
            <StatusCard
              icon={<Bell className="w-5 h-5" />}
              label="Buzzer Status"
              value={data.buzzerOn === null ? null : data.buzzerOn ? "Active" : "Silent"}
              status={data.buzzerOn === null ? "unknown" : data.buzzerOn ? "danger" : "safe"}
              blinking={data.buzzerOn === true}
            />
          </div>
        </div>

        {/* Distance + WiFi */}
        <div className="grid grid-cols-2 gap-4">
          {/* Distance */}
          <div className={`rounded-2xl border p-5 transition-all duration-500 ${
            distanceDanger
              ? "helmet-card-danger bg-red-950/50 border-red-700/60 shadow-[0_0_20px_rgba(248,113,113,0.2)] ring-1 ring-red-500/30"
              : "helmet-card-unknown bg-slate-800/50 border-slate-700/60"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl helmet-card-icon-bg ${distanceDanger ? "bg-red-900/60" : "bg-slate-700/60"}`}>
                <Ruler className={`w-4 h-4 ${distanceDanger ? "text-red-400" : "text-slate-400"}`} />
              </div>
              {distanceDanger && <span className="w-3 h-3 rounded-full bg-red-400 blink-danger" />}
            </div>
            <p className="helmet-text-label text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Distance</p>
            <div className="flex items-end gap-2">
              <span className={`helmet-card-value text-2xl font-black tabular-nums ${distanceDanger ? "text-red-300" : "text-slate-300"}`}>
                {data.distance != null ? data.distance.toFixed(1) : "—"}
              </span>
              {data.distance != null && <span className="helmet-text-muted text-slate-400 text-sm mb-0.5 font-semibold">cm</span>}
            </div>
            {data.distance != null && (
              <>
                <div className="mt-3 h-1.5 rounded-full helmet-bar-bg bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${data.distance < 20 ? "bg-red-500" : data.distance < 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min((data.distance / 200) * 100, 100)}%` }}
                  />
                </div>
                <p className={`text-xs mt-1.5 ${distanceDanger ? "text-red-400" : "helmet-text-muted text-slate-500"}`}>
                  {data.distance < 20 ? "Too close!" : data.distance < 50 ? "Caution" : "Clear"}
                </p>
              </>
            )}
          </div>

          {/* WiFi Signal */}
          <div className="helmet-card-unknown bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-xl helmet-card-icon-bg bg-slate-700/60">
                <Signal className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <p className="helmet-text-label text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">WiFi Signal</p>
            {data.rssi != null ? (
              <>
                <div className="flex items-end gap-2">
                  <span className={`text-2xl font-black tabular-nums ${data.rssi >= -60 ? "text-emerald-400" : data.rssi >= -75 ? "text-amber-400" : "text-red-400"}`}>
                    {data.rssi}
                  </span>
                  <span className="helmet-text-muted text-slate-400 text-sm mb-0.5 font-semibold">dBm</span>
                </div>
                <div className="flex items-end gap-1 mt-3">
                  {[1, 2, 3, 4].map((bar) => {
                    const strength = data.rssi! >= -60 ? 4 : data.rssi! >= -70 ? 3 : data.rssi! >= -80 ? 2 : 1;
                    return (
                      <div key={bar}
                        className={`rounded-sm transition-all duration-500 ${bar <= strength
                          ? strength >= 3 ? "bg-emerald-400" : strength === 2 ? "bg-amber-400" : "bg-red-400"
                          : "helmet-bar-bg bg-slate-700"}`}
                        style={{ width: "14px", height: `${bar * 5 + 4}px` }}
                      />
                    );
                  })}
                  <span className={`text-xs font-semibold ml-1.5 mb-0.5 ${data.rssi >= -60 ? "text-emerald-500" : data.rssi >= -75 ? "text-amber-500" : "text-red-500"}`}>
                    {data.rssi >= -60 ? "Excellent" : data.rssi >= -70 ? "Good" : data.rssi >= -80 ? "Fair" : "Weak"}
                  </span>
                </div>
              </>
            ) : (
              <p className="helmet-card-value text-2xl font-bold text-slate-400">—</p>
            )}
          </div>
        </div>

        {/* MQ3 Sensor Bar */}
        {data.alcoholValue != null && (
          <div className="helmet-sensor-panel helmet-surface rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-slate-400 helmet-text-secondary" />
              <span className="helmet-text-secondary text-sm font-semibold text-slate-300 uppercase tracking-wider">Live Sensor Data</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-foreground tabular-nums">{data.alcoholValue}</span>
              <div className="mb-1">
                <p className="text-xs text-slate-400 helmet-text-secondary font-semibold">MQ3 RAW</p>
                <p className="text-xs text-slate-500 helmet-text-muted">Alcohol sensor value</p>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full helmet-bar-bg bg-slate-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.alcoholValue > alertConfig.mq3Threshold ? "bg-red-500"
                    : data.alcoholValue > alertConfig.mq3Threshold / 2 ? "bg-amber-400"
                    : "bg-emerald-400"}`}
                style={{ width: `${Math.min((data.alcoholValue / 1023) * 100, 100)}%` }}
              />
            </div>
            <div className="relative h-3 mt-0.5">
              <div
                className="absolute top-0 w-0.5 h-3 bg-cyan-400/70 rounded-full"
                style={{ left: `${Math.min((alertConfig.mq3Threshold / 1023) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs helmet-text-muted text-slate-600 mt-1">
              <span>0</span>
              <span className="text-cyan-500">▲ {alertConfig.mq3Threshold}</span>
              <span>1023</span>
            </div>
          </div>
        )}

        {/* Idle State */}
        {!isConnected && status !== "error" && (
          <div className="helmet-idle-box rounded-2xl border border-slate-700/40 bg-slate-800/30 p-8 text-center space-y-3">
            <div className="p-4 rounded-full helmet-icon-bg bg-slate-700/40 w-fit mx-auto">
              <WifiOff className="w-8 h-8 text-slate-500 helmet-text-muted" />
            </div>
            <p className="helmet-text-secondary text-slate-400 font-semibold">No Device Connected</p>
            <p className="helmet-text-muted text-slate-500 text-sm max-w-xs mx-auto">
              Enter your ESP32's IP address above and press{" "}
              <strong className="helmet-text-secondary text-slate-400">Connect WiFi</strong>. Make sure your device and ESP32 are on the same WiFi network.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs helmet-footer-text text-slate-600 pb-4 space-y-1">
          <p>Smart Helmet System • ESP32 WiFi Monitor</p>
          <p>ESP32 sends data via WebSocket server on port 81</p>
          <p className="font-mono helmet-footer-mono text-slate-700">helmet:1,alcohol:0,mq3:87,drowsy:0,motor:1,led:1,buzzer:0,dist:85,rssi:-65</p>
        </div>
      </div>
    </div>
  );
}
