"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Database,
  Layers,
  ShieldCheck,
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Zap,
  ArrowUpRight,
  ChevronRight,
  Sliders,
  Terminal,
  Activity,
  Cpu,
  Lock,
} from "lucide-react";

interface SearchResult {
  id: string;
  score: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

interface Diagnostics {
  redis: { configured: boolean; connected: boolean; latencyMs: number; details: string };
  vector: { configured: boolean; connected: boolean; details: string };
  qstash: { configured: boolean; details: string };
}

type TabType = "search" | "ratelimit" | "qstash" | "architecture";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>("search");

  // Search state
  const [searchQuery, setSearchQuery] = useState("serverless caching");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<{
    source: string;
    latencyMs: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Rate Limiting state
  const [rateLimitStatus, setRateLimitStatus] = useState<any>(null);
  const [isHittingRateLimit, setIsHittingRateLimit] = useState(false);
  const [rateLimitHistory, setRateLimitHistory] = useState<
    { id: string; time: string; status: number; remaining: number }[]
  >([]);

  // Trending state
  const [trending, setTrending] = useState<{ query: string; count: number }[]>([]);

  // QStash Ingest state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("redis");
  const [ingestStatus, setIngestStatus] = useState<any>(null);
  const [isIngesting, setIsIngesting] = useState(false);

  // Diagnostics
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [isRefreshingDiag, setIsRefreshingDiag] = useState(false);

  useEffect(() => {
    fetchDiagnostics();
    fetchTrending();
    // Run initial search
    handleSearch("serverless caching");
  }, []);

  async function fetchDiagnostics() {
    setIsRefreshingDiag(true);
    try {
      const res = await fetch("/api/diagnostics");
      const data = await res.json();
      setDiagnostics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshingDiag(false);
    }
  }

  async function fetchTrending() {
    try {
      const res = await fetch("/api/trending");
      const data = await res.json();
      if (data.trending) setTrending(data.trending);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSearch(q = searchQuery) {
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
        setSearchMeta({
          source: data.source,
          latencyMs: data.latencyMs,
        });
      }
      fetchTrending();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }

  async function testRateLimit() {
    setIsHittingRateLimit(true);
    try {
      const res = await fetch("/api/ratelimit-demo", { method: "POST" });
      const data = await res.json();
      const status = res.status;
      setRateLimitStatus({
        status,
        ...data,
      });
      setRateLimitHistory((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          time: new Date().toLocaleTimeString(),
          status,
          remaining: data.remaining ?? 0,
        },
        ...prev.slice(0, 7),
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsHittingRateLimit(false);
    }
  }

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    setIsIngesting(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          category: newCategory,
          tags: [newCategory, "production"],
        }),
      });
      const data = await res.json();
      setIngestStatus(data);
      setNewTitle("");
      setNewContent("");
      // Refresh search results
      handleSearch(newTitle);
    } catch (e) {
      console.error(e);
    } finally {
      setIsIngesting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800/60 sticky top-0 z-30 bg-[#09090b]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold shadow-sm">
              ▲
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium tracking-tight text-zinc-100">
                upstash<span className="text-zinc-500">/</span>engine
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                v1.0
              </span>
            </div>
          </div>

          {/* Live Telemetry Pills */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    diagnostics?.redis.connected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                  }`}
                />
                <span>Redis</span>
                {diagnostics?.redis.connected && (
                  <span className="text-zinc-500 text-[11px]">{diagnostics.redis.latencyMs}ms</span>
                )}
              </div>

              <span className="text-zinc-700">/</span>

              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    diagnostics?.vector.connected ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"
                  }`}
                />
                <span>Vector</span>
                <span className="text-zinc-500 text-[11px]">384d</span>
              </div>

              <span className="text-zinc-700">/</span>

              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    diagnostics?.qstash.configured ? "bg-emerald-500" : "bg-zinc-600"
                  }`}
                />
                <span>QStash</span>
              </div>
            </div>

            <button
              onClick={fetchDiagnostics}
              disabled={isRefreshingDiag}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingDiag ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Page Hero */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
            Serverless Architecture Console
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Production patterns for high-throughput Next.js apps deployed on Vercel:
            sub-millisecond in-memory caching, geometric vector retrieval, and decoupled task queuing.
          </p>
        </div>

        {/* Minimal Segmented Tab Switcher */}
        <div className="flex items-center border-b border-zinc-800/80 gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: "search", label: "Semantic Search", icon: Search },
            { id: "ratelimit", label: "Rate Limiting & Security", icon: ShieldCheck },
            { id: "qstash", label: "Async Task Queue", icon: Layers },
            { id: "architecture", label: "System Topology", icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? "border-emerald-500 text-zinc-100"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Semantic Search & Cache-Aside */}
        {activeTab === "search" && (
          <div className="space-y-6">
            {/* Search Input Command Bar */}
            <div className="space-y-3">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Query knowledge base (e.g. 'How to cache with TTL?')"
                  className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-xl px-4 py-3 pl-10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all font-sans"
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <div className="absolute right-3 top-2.5 flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/40">
                    ↵ Enter
                  </span>
                  <button
                    onClick={() => handleSearch()}
                    disabled={isSearching}
                    className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-lg text-xs transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Search"}
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-zinc-500 text-[11px]">Quick samples:</span>
                {[
                  "serverless caching",
                  "rate limiting security",
                  "vector embeddings",
                  "background jobs",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSearchQuery(q);
                      handleSearch(q);
                    }}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors font-mono"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Metric Bar */}
            {searchMeta && (
              <div
                className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                  searchMeta.source === "redis_cache"
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    LATENCY: <strong>{searchMeta.latencyMs}ms</strong>
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span>
                    SOURCE:{" "}
                    <span className="font-semibold uppercase text-zinc-200">
                      {searchMeta.source === "redis_cache" ? "Upstash Redis (Cache-Aside)" : "Upstash Vector (Cosine DB)"}
                    </span>
                  </span>
                </div>

                <div className="text-[11px] text-zinc-400 font-sans">
                  {searchMeta.source === "redis_cache"
                    ? "⚡ Served from Redis in-memory cache without querying vector storage"
                    : "🔍 Computed via 384-dimensional cosine similarity & cached for 5 min"}
                </div>
              </div>
            )}

            {/* Results Grid */}
            <div className="space-y-2.5">
              {searchResults.length === 0 ? (
                <div className="py-16 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                  No matches returned. Type a query above to query the vector index.
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 hover:border-zinc-700/80 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                          {(item.score * 100).toFixed(1)}% match
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">{item.content}</p>

                    <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-zinc-500">
                      <span className="uppercase text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                      {item.tags.map((tag) => (
                        <span key={tag}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Rate Limiting & Trending */}
        {activeTab === "ratelimit" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rate Limiter Tester */}
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-zinc-100">Sliding Window Protection</h2>
                  <p className="text-xs text-zinc-400">Enforces 5 requests per 10 seconds via Redis</p>
                </div>
                <span className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/60 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">QUOTA REMAINING</span>
                  <span className="text-zinc-200 font-bold">
                    {rateLimitStatus ? `${rateLimitStatus.remaining} / ${rateLimitStatus.limit}` : "5 / 5"}
                  </span>
                </div>

                {/* Quota Segments */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((idx) => {
                    const remaining = rateLimitStatus?.remaining ?? 5;
                    const isFilled = idx <= remaining;
                    return (
                      <div
                        key={idx}
                        className={`h-2 rounded transition-all ${
                          isFilled
                            ? "bg-emerald-500"
                            : "bg-red-500/80 border border-red-500/30"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <button
                onClick={testRateLimit}
                disabled={isHittingRateLimit}
                className="w-full py-2 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isHittingRateLimit ? "Evaluating with Redis..." : "Dispatch Request to Protected Route"}
              </button>

              {/* Request Telemetry Log */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Recent Edge Evaluations:</span>
                <div className="space-y-1">
                  {rateLimitHistory.length === 0 ? (
                    <div className="text-[11px] text-zinc-600 font-mono py-2">Click above to send requests</div>
                  ) : (
                    rateLimitHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-zinc-950/70 border border-zinc-850"
                      >
                        <span className="text-zinc-400">{item.time}</span>
                        <span className="text-zinc-500">POST /api/ratelimit-demo</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            item.status === 200
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                              : "bg-red-950/60 text-red-400 border border-red-800/40"
                          }`}
                        >
                          {item.status === 200 ? "200 ALLOWED" : "429 BLOCKED"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Trending Queries Leaderboard */}
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-zinc-100">Live Search Leaderboard</h2>
                  <p className="text-xs text-zinc-400">Atomic frequency counters in Redis Sorted Sets (ZSET)</p>
                </div>
                <span className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>

              <div className="space-y-1.5">
                {trending.length === 0 ? (
                  <div className="text-xs text-zinc-500 py-8 text-center">No search history recorded yet</div>
                ) : (
                  trending.map((item, idx) => (
                    <div
                      key={item.query}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/50 border border-zinc-850 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 text-zinc-300">
                        <span className="text-zinc-600 w-4">#{idx + 1}</span>
                        <span>{item.query}</span>
                      </div>
                      <span className="text-emerald-400 font-semibold bg-emerald-950/50 px-2 py-0.5 rounded text-[11px] border border-emerald-900/30">
                        {item.count} hits
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-850 text-[11px] text-zinc-400 space-y-1">
                <span className="font-mono text-zinc-300 font-medium">Why Sorted Sets?</span>
                <p className="leading-relaxed">
                  Avoids running expensive SQL aggregations. Redis commands like <code className="text-zinc-300">ZINCRBY</code> and{" "}
                  <code className="text-zinc-300">ZREVRANGE</code> execute in <code className="text-zinc-300">O(log N)</code> time.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: QStash Task Queue */}
        {activeTab === "qstash" && (
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-zinc-100">Asynchronous Document Ingestion</h2>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Dispatches document ingestion to the Upstash QStash queue. The client receives an immediate response
                  in &lt; 20ms while the webhook endpoint consumes the message with HMAC cryptographic verification.
                </p>
              </div>
              <span className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 shrink-0">
                <Layers className="w-4 h-4" />
              </span>
            </div>

            <form onSubmit={handleIngest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-mono text-zinc-400">DOCUMENT TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Locks with Redis and Lua"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-zinc-400">CATEGORY</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                >
                  <option value="redis">Redis</option>
                  <option value="vector">Vector</option>
                  <option value="qstash">QStash</option>
                  <option value="architecture">Architecture</option>
                </select>
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-mono text-zinc-400">CONTENT</label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste technical documentation or notes to be vectorized..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 font-sans"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isIngesting}
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Dispatch Task to QStash
                </button>
              </div>
            </form>

            {/* Task Receipt */}
            {ingestStatus && (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5 animate-in fade-in">
                <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {ingestStatus.message}
                </div>
                {ingestStatus.messageId && (
                  <div className="text-zinc-400 text-[11px] break-all">
                    MESSAGE_ID: <span className="text-zinc-200">{ingestStatus.messageId}</span>
                  </div>
                )}
                {ingestStatus.destinationUrl && (
                  <div className="text-zinc-500 text-[11px]">
                    DESTINATION: <span className="text-zinc-400">{ingestStatus.destinationUrl}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Architecture & Topology */}
        {activeTab === "architecture" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  REDIS LAYER
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">Speed & Protection</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Stateless HTTP client prevents TCP connection exhaustion on Vercel. Implements sliding window rate
                  limiting and sub-5ms Cache-Aside.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  VECTOR LAYER
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">Semantic Intelligence</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Serverless high-dimensional embeddings using BGE_SMALL_EN_V1_5. Executes cosine similarity queries
                  over raw text with zero external LLM API costs.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  QSTASH LAYER
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">Decoupled Processing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Eliminates serverless function timeouts. Queues background tasks with automatic retries and HMAC
                  cryptographic signature verification.
                </p>
              </div>
            </div>

            {/* Diagnostic Configuration Overview */}
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3 font-mono text-xs">
              <span className="text-zinc-400 uppercase text-[11px]">Active Service Endpoints</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-500">UPSTASH_REDIS_REST_URL</span>
                  <span className="text-zinc-300">actual-koi-285803.upstash.io</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-500">UPSTASH_VECTOR_REST_URL</span>
                  <span className="text-zinc-300">humorous-lacewing-91070-us1-vector.upstash.io</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-zinc-950 border border-zinc-850">
                  <span className="text-zinc-500">QSTASH_INSTANCE</span>
                  <span className="text-zinc-300">6b483742-6d36-4b4f-91e8-4a294543debf (eu-central-1)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-6 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px]">
          <span>UPSTASH_ENGINE // NEXT.JS 15 (APP ROUTER)</span>
          <div className="flex items-center gap-4 text-zinc-400">
            <a
              href="https://github.com/j1znuneel/upstash-test"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-100 transition-colors flex items-center gap-1"
            >
              GitHub <ArrowUpRight className="w-3 h-3" />
            </a>
            <a
              href="https://console.upstash.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-100 transition-colors flex items-center gap-1"
            >
              Console <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
