import { Bell, BellOff, X, Trash2, CheckCheck, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { AppNotification, NotificationPermission } from "@/hooks/useNotifications";

interface NotificationPanelProps {
  notifications: AppNotification[];
  unreadCount: number;
  permission: NotificationPermission;
  onRequestPermission: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const typeConfig = {
  danger: {
    icon: <ShieldAlert className="w-4 h-4" />,
    iconBg: "bg-red-900/60",
    iconColor: "text-red-400",
    itemClass: "notif-item-danger border-l-red-500 bg-red-950/20",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    iconBg: "bg-amber-900/60",
    iconColor: "text-amber-400",
    itemClass: "notif-item-warning border-l-amber-500 bg-amber-950/20",
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    iconBg: "bg-cyan-900/60",
    iconColor: "text-cyan-400",
    itemClass: "notif-item-info border-l-cyan-500 bg-cyan-950/20",
  },
};

export function NotificationPanel({
  notifications,
  unreadCount,
  permission,
  onRequestPermission,
  onMarkAllRead,
  onClearAll,
  open,
  onOpenChange,
}: NotificationPanelProps) {
  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => onOpenChange(!open)}
        className="helmet-btn-secondary relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all duration-200"
      >
        <Bell className="w-4 h-4" />
        Alerts
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center blink-danger">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

          <div className="helmet-notif-panel relative w-full max-w-sm h-full bg-slate-900 border-l border-slate-700/60 flex flex-col shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-red-900/40">
                  <Bell className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h2 className="notif-title font-bold text-white text-base">Notifications</h2>
                  <p className="notif-time text-xs text-slate-500">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Permission banner */}
            {permission !== "granted" && (
              <div className="mx-4 mt-4 rounded-xl border border-amber-700/50 bg-amber-950/40 p-3 shrink-0">
                <div className="flex items-start gap-2.5">
                  <BellOff className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-300">
                      {permission === "denied" ? "Notifications blocked" : "Enable push notifications"}
                    </p>
                    <p className="text-xs text-amber-500 mt-0.5">
                      {permission === "denied"
                        ? "Allow notifications in browser settings to receive push alerts."
                        : "Get instant push alerts when safety rules are violated."}
                    </p>
                    {permission !== "denied" && (
                      <button onClick={onRequestPermission} className="mt-2 text-xs font-bold text-amber-300 underline underline-offset-2">
                        Enable now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between px-5 py-2 shrink-0">
                <button onClick={onMarkAllRead} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
                <button onClick={onClearAll} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Clear all
                </button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-3">
                  <div className="p-4 rounded-full bg-slate-800/60">
                    <Bell className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="notif-body text-slate-500 font-semibold text-sm">No notifications yet</p>
                  <p className="notif-time text-slate-600 text-xs max-w-xs">
                    Alerts appear here when safety rules are violated.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const cfg = typeConfig[notif.type];
                  return (
                    <div
                      key={notif.id}
                      className={`rounded-xl border-l-2 p-3 transition-all duration-200 ${cfg.itemClass} ${!notif.read ? "ring-1 ring-slate-600/30" : "opacity-60"}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg ${cfg.iconBg} shrink-0 mt-0.5`}>
                          <div className={cfg.iconColor}>{cfg.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="notif-title text-sm font-bold text-white truncate">{notif.title}</p>
                            {!notif.read && <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />}
                          </div>
                          <p className="notif-body text-xs text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="notif-time text-xs text-slate-600 mt-1">{timeAgo(notif.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
