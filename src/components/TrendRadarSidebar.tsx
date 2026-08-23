import React, { useState } from 'react';
import { Bell, TrendingUp, Zap, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { IntelAlert, TrendSignal } from '../types';

interface TrendRadarSidebarProps {
  trends: TrendSignal[];
  alerts: IntelAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onSelectTrendTopic?: (topic: string) => void;
}

export const TrendRadarSidebar: React.FC<TrendRadarSidebarProps> = ({
  trends,
  alerts,
  onAcknowledgeAlert,
  onSelectTrendTopic
}) => {
  const [showTrends, setShowTrends] = useState(false);
  const unreadAlerts = alerts.filter((a) => !a.isRead);

  return (
    <aside className="w-64 sm:w-72 border-l border-[#27272A] bg-[#0E0E10] flex flex-col p-3.5 shrink-0 overflow-y-auto select-none space-y-4">
      {/* 1. Priority Alerts Notification Panel */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono font-semibold flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-[#FF4F00]" />
            <span>Priority Alerts</span>
          </h3>
          {unreadAlerts.length > 0 && (
            <span className="text-[10px] font-mono text-[#FF4F00] bg-[#FF4F00]/20 px-1.5 py-0.5 rounded font-bold">
              {unreadAlerts.length} NEW
            </span>
          )}
        </div>

        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-xs text-[#71717A] p-3 border border-[#27272A] rounded-lg text-center bg-[#121214]">
              No active alerts.
            </div>
          ) : (
            alerts.slice(0, 3).map((alert) => {
              const isCrit = alert.severity === 'critical';
              return (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-lg text-xs transition-all ${
                    isCrit
                      ? 'bg-[#FF4F00]/10 border border-[#FF4F00]/30 text-white'
                      : 'bg-sky-500/10 border border-sky-500/30 text-white'
                  } ${alert.isRead ? 'opacity-60' : 'opacity-100'}`}
                >
                  <div className="flex items-center justify-between mb-1 gap-1">
                    <span className="font-bold uppercase flex items-center gap-1 text-[11px] truncate">
                      {isCrit ? (
                        <ShieldAlert className="w-3 h-3 text-[#FF4F00] shrink-0" />
                      ) : (
                        <Zap className="w-3 h-3 text-sky-400 shrink-0" />
                      )}
                      <span className={isCrit ? 'text-[#FF4F00] truncate' : 'text-sky-300 truncate'}>
                        {alert.headline}
                      </span>
                    </span>
                    {!alert.isRead && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="text-[9px] font-mono px-1.5 py-0.5 bg-black/40 hover:bg-black rounded text-white shrink-0 border border-white/20 transition-colors"
                        title="Dismiss alert"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#D4D4D8] leading-relaxed mb-1.5">
                    {alert.reason}
                  </p>
                  <div className="flex justify-between text-[9px] text-[#71717A] font-mono border-t border-white/10 pt-1">
                    <span>{alert.source}</span>
                    <span>{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Compact / Collapsible Emerging Trends Panel */}
      <div className="pt-2 border-t border-[#222225]">
        <button
          onClick={() => setShowTrends(!showTrends)}
          className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-[#A1A1AA] hover:text-white font-mono font-semibold py-1.5"
        >
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#00FF9C]" />
            <span>Emerging Trends ({trends.length})</span>
          </div>
          {showTrends ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {showTrends && (
          <div className="space-y-2 mt-2">
            {trends.length === 0 ? (
              <div className="text-[11px] text-[#71717A] p-2.5 border border-[#27272A] rounded-lg text-center bg-[#121214]">
                Scanning for emerging clusters...
              </div>
            ) : (
              trends.map((trend) => (
                <div
                  key={trend.id}
                  onClick={() => onSelectTrendTopic && onSelectTrendTopic(trend.topic)}
                  className="bg-[#121214] border border-[#27272A] p-2.5 rounded-lg hover:border-[#00FF9C]/40 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-center text-xs mb-1 font-medium">
                    <span className="text-[#E4E4E7] group-hover:text-[#00FF9C] truncate pr-1">
                      {trend.topic}
                    </span>
                    <span className="text-[10px] font-mono text-[#00FF9C] shrink-0">
                      {trend.itemCount} signals
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-mono text-[#71717A]">
                    <span className="capitalize text-[#A1A1AA]">{trend.velocity} Velocity</span>
                    <span>Active cluster</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

