'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Search, Trash2, Heart, Activity, Users, AlertTriangle, Sun, Moon } from 'lucide-react';

// ─── Domain Types ─────────────────────────────────────────────────────────────

interface MetricBreakdown {
  subject: string;
  score: number;
}

interface RepoAnalysis {
  overall: number;
  status: string;
  color: string;
  breakdown: MetricBreakdown[];
}

interface RawData {
  avatars?: (string | undefined)[];  // Fix: entries can be undefined
}

interface Repository {
  id: number;
  name: string;
  rawData?: RawData;
  analysis: RepoAnalysis;
}

// ─── Store Type ───────────────────────────────────────────────────────────────
// Ideally exported from @/lib/store and imported — not redefined here.

interface StoreState {
  repos: Repository[];
  loading: boolean;
  error: string | null;
  addRepo: (name: string) => Promise<void>;
  removeRepo: (id: number) => void;
  clearAll: () => void;
}

// ─── Comparison Row Type ──────────────────────────────────────────────────────

interface ComparisonRow {
  name: string;
  'Overall Score': number;
  [metric: string]: string | number;  // Fix: explicit index signature instead of any
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Fix: single cast — remove `as unknown` if useStore is properly typed in @/lib/store
  const store = useStore() as StoreState;
  const repos = store?.repos ?? [];
  const loading = store?.loading ?? false;
  const error = store?.error ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {  // Fix: typed event
    e.preventDefault();
    if (!input.trim() || loading) return;
    await store.addRepo(input.trim());
    setInput('');
  };

  const comparisonData: ComparisonRow[] = repos.map((r) => {
    const dataRow: ComparisonRow = {
      name: r?.name ?? 'Unknown',
      'Overall Score': r?.analysis?.overall ?? 0,
    };

    if (Array.isArray(r?.analysis?.breakdown)) {
      r.analysis.breakdown.forEach((item) => {
        if (item?.subject) {
          dataRow[item.subject] = item.score ?? 0;
        }
      });
    }

    return dataRow;
  });

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Initializing Workspace Nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans antialiased p-6 ${
      isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-50'
    }`}>

      {/* Header Container */}
      <header className={`max-w-7xl mx-auto mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6 ${
        isLightMode ? 'border-slate-200' : 'border-slate-900'
      }`}>
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
            ✨ Open Source Health Scorecard
          </h1>
          <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Real-time health audits directly from the GitHub API layer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
              isLightMode
                ? 'bg-white border-slate-200 text-amber-500 hover:bg-slate-100 shadow-sm'
                : 'bg-slate-900/50 border-slate-800 text-yellow-400 hover:border-slate-700'
            }`}
            title={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {repos.length > 0 && (
            <button
              onClick={() => store.clearAll()}
              className={`text-xs font-semibold border px-4 py-2 rounded-xl transition-all duration-200 ${
                isLightMode
                  ? 'bg-white border-slate-200 hover:border-red-500 hover:text-red-500 text-slate-700 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800 hover:border-red-500/50 hover:text-red-400'
              }`}
            >
              Clear Workspace
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`border p-6 rounded-2xl shadow-xl transition-colors duration-300 ${
            isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/40 backdrop-blur-md border-slate-900'
          }`}>
            <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" /> Analyze Repository
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., facebook/react or vercel/next.js"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all pl-10 disabled:opacity-50 ${
                    isLightMode ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800/80 text-slate-200'
                  }`}
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-slate-950 font-bold py-3 rounded-xl transition-all text-sm flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                    <span>Analyzing Network...</span>
                  </>
                ) : (
                  'Run Live Diagnostics'
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className={`mt-5 pt-4 border-t text-xs space-y-2 ${isLightMode ? 'border-slate-100 text-slate-400' : 'border-slate-900 text-slate-500'}`}>
              <p>💡 <strong>Quick Test Templates:</strong></p>
              <div className="flex flex-col gap-1.5">
                <code
                  className={`block p-2 rounded-lg border text-cyan-500 cursor-pointer transition text-left ${
                    isLightMode ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                  }`}
                  onClick={() => setInput('vercel/next.js')}
                >vercel/next.js</code>
                <code
                  className={`block p-2 rounded-lg border text-emerald-500 cursor-pointer transition text-left ${
                    isLightMode ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                  }`}
                  onClick={() => setInput('tailwindlabs/tailwindcss')}
                >tailwindlabs/tailwindcss</code>
              </div>
            </div>
          </div>

          {/* Active Sidebar List */}
          <div className="space-y-3">
            {repos.map((repo) => (
              <div key={repo.id} className={`border p-4 rounded-xl flex justify-between items-center group transition-all duration-200 ${
                isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/20 border-slate-900/60'
              }`}>
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className={`font-bold text-sm truncate ${isLightMode ? 'text-slate-800' : 'text-slate-200'}`}>{repo.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: repo?.analysis?.color ?? '#3b82f6' }} />
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: repo?.analysis?.color ?? '#3b82f6' }}>
                      {repo?.analysis?.status ?? 'Good'} ({repo?.analysis?.overall ?? 0}/100)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => store.removeRepo(repo.id)}
                  className="text-slate-500 hover:text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-150"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Visual Panels */}
        <div className="lg:col-span-8 space-y-8">
          {repos.length === 0 ? (
            <div className={`h-72 border border-dashed rounded-2xl flex flex-col justify-center items-center text-center p-6 ${
              isLightMode ? 'border-slate-300 text-slate-400' : 'border-slate-900 text-slate-500'
            }`}>
              <Heart className={`w-8 h-8 mb-3 animate-pulse ${isLightMode ? 'text-slate-300' : 'text-slate-800'}`} />
              <p className="text-sm font-medium">Workspace is empty</p>
              <p className="text-xs max-w-xs mt-1 opacity-70">Execute a live diagnostic audit to initialize the radar matrices and comparison nodes.</p>
            </div>
          ) : (
            <>
              {/* Primary Analytics Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`border p-6 rounded-2xl flex flex-col justify-between shadow-xl transition-colors duration-300 ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/30 border-slate-900'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active View Deck</span>
                    <h2 className={`text-2xl font-black mt-0.5 truncate ${isLightMode ? 'text-slate-900' : 'text-slate-100'}`}>{repos[0]?.name}</h2>

                    {/* Fix: safe nullish checks with non-null assertions after Array.isArray guard */}
                    {Array.isArray(repos[0]?.rawData?.avatars) && repos[0].rawData!.avatars!.length > 0 && (
                      <div className={`flex items-center gap-2.5 mt-3 border p-2 rounded-xl w-fit ${
                        isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-900/60'
                      }`}>
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {repos[0].rawData!.avatars!.slice(0, 5).map((url, i) => (
                            <img
                              key={i}
                              className={`inline-block h-5 w-5 rounded-full object-cover select-none ring-2 ${
                                isLightMode ? 'ring-white' : 'ring-slate-900'
                              }`}
                              src={url ?? ''}  // Fix: nullish coalescing
                              alt="Maintainer"
                              crossOrigin="anonymous"
                              loading="lazy"
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3 text-cyan-500" /> Core Maintainers
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3.5 my-6">
                    {repos[0]?.analysis?.breakdown?.map((item) => (
                      <div key={item.subject}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400 font-medium">{item.subject}</span>
                          <span className={isLightMode ? 'text-slate-700 font-bold' : 'text-slate-300 font-bold'}>{item.score}/100</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden border ${
                          isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-900'
                        }`}>
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`p-3.5 border rounded-xl flex items-center justify-between shadow-inner ${
                    isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-900'
                  }`}>
                    <span className="text-xs font-semibold text-slate-400">Aggregated Health Vector:</span>
                    <span className="text-3xl font-black tracking-tight" style={{ color: repos[0]?.analysis?.color ?? '#22c55e' }}>
                      {repos[0]?.analysis?.overall ?? 0}
                    </span>
                  </div>
                </div>

                {/* Radar Chart Display */}
                <div className={`border p-6 rounded-2xl flex flex-col justify-between items-center min-h-[320px] shadow-xl transition-colors duration-300 ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/30 border-slate-900'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-start">Vector Spectrum Map</span>
                  <div className="w-full h-full min-h-[240px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" data={repos[0]?.analysis?.breakdown ?? []}>
                        <PolarGrid stroke={isLightMode ? '#e2e8f0' : '#1e293b'} />
                        <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} fontWeight={600} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={isLightMode ? '#e2e8f0' : '#1e293b'} tick={false} />
                        <Radar
                          name={repos[0]?.name ?? 'Project'}
                          dataKey="score"
                          stroke={repos[0]?.analysis?.color ?? '#06b6d4'}
                          fill={repos[0]?.analysis?.color ?? '#06b6d4'}
                          fillOpacity={isLightMode ? 0.1 : 0.15}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Comparison Matrix Chart Container */}
              {repos.length > 1 && (
                <div className={`border p-6 rounded-2xl shadow-xl transition-colors duration-300 ${
                  isLightMode ? 'bg-white border-slate-200' : 'bg-slate-900/30 border-slate-900'
                }`}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Cross-Project Comparison Matrix</h3>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ bottom: 40, left: -10, right: 0, top: 5 }}>
                        <XAxis
                          dataKey="name"
                          stroke="#64748b"
                          fontSize={10}
                          tickLine={false}
                          angle={-12}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isLightMode ? '#ffffff' : '#020617',
                            borderColor: isLightMode ? '#e2e8f0' : '#1e293b',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: isLightMode ? '#0f172a' : '#f8fafc',
                          }}
                        />
                        <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 500 }} />
                        <Bar dataKey="Overall Score" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        <Bar dataKey="Maintenance" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        <Bar dataKey="Community" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}