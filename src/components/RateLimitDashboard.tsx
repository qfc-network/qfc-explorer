'use client';

import { useState } from 'react';

type TopIp = {
  ip: string;
  requests: number;
  limited: boolean;
  resetAt: number;
};

type RecentRequest = {
  ip: string;
  path: string;
  timestamp: number;
  limited: boolean;
};

type Props = {
  topIps: TopIp[];
  recentRequests: RecentRequest[];
};

export default function RateLimitDashboard({ topIps, recentRequests }: Props) {
  const [activeTab, setActiveTab] = useState<'ips' | 'requests'>('ips');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('ips')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'ips'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Top IPs ({topIps.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Recent Requests ({recentRequests.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'ips' ? (
          <TopIpsTable ips={topIps} />
        ) : (
          <RecentRequestsTable requests={recentRequests} />
        )}
      </div>
    </div>
  );
}

function TopIpsTable({ ips }: { ips: TopIp[] }) {
  if (ips.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        No active IPs in current window
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="pb-3 font-medium">IP Address</th>
            <th className="pb-3 font-medium text-right">Requests</th>
            <th className="pb-3 font-medium text-right">Usage</th>
            <th className="pb-3 font-medium text-center">Status</th>
            <th className="pb-3 font-medium text-right">Resets In</th>
          </tr>
        </thead>
        <tbody>
          {ips.map((ip, i) => {
            const usagePercent = (ip.requests / 100) * 100;
            const resetIn = Math.max(0, Math.ceil((ip.resetAt - Date.now()) / 1000));

            return (
              <tr key={i} className="border-t border-slate-800">
                <td className="py-3 font-mono text-slate-300">{ip.ip}</td>
                <td className="py-3 text-right font-mono text-slate-300">{ip.requests}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent >= 80 ? 'bg-red-500' : usagePercent >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, usagePercent)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-10">{usagePercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      ip.limited
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ip.limited ? 'bg-red-400' : 'bg-green-400'}`} />
                    {ip.limited ? 'Limited' : 'OK'}
                  </span>
                </td>
                <td className="py-3 text-right text-slate-400">{resetIn}s</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecentRequestsTable({ requests }: { requests: RecentRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        No recent requests recorded
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-80 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-900">
          <tr className="text-left text-slate-500">
            <th className="pb-3 font-medium">Time</th>
            <th className="pb-3 font-medium">IP</th>
            <th className="pb-3 font-medium">Path</th>
            <th className="pb-3 font-medium text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req, i) => {
            const time = new Date(req.timestamp);
            const timeStr = time.toLocaleTimeString();

            return (
              <tr key={i} className="border-t border-slate-800">
                <td className="py-2 text-slate-400 text-xs">{timeStr}</td>
                <td className="py-2 font-mono text-slate-300 text-xs">{req.ip}</td>
                <td className="py-2 font-mono text-slate-400 text-xs truncate max-w-[200px]">
                  {req.path}
                </td>
                <td className="py-2 text-center">
                  {req.limited ? (
                    <span className="text-red-400 text-xs">429</span>
                  ) : (
                    <span className="text-green-400 text-xs">200</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
