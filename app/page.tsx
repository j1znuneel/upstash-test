"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
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
  ArrowRight,
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

export default function HomePage() {
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

  // Load initial diagnostics & trending
  useEffect(() => {
    fetchDiagnostics();
    fetchTrending();
  }, []);

  async function fetchDiagnostics() {
    try {
      const res = await fetch("/api/diagnostics");
      const data = await res.json();
      setDiagnostics(data);
    } catch (e) {
      console.error(e);
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
      setRateLimitStatus({
        status: res.status,
        ...data,
      });
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
          tags: [newCategory, "user-submitted"],
        }),
      });
      const data = await res.json();
      setIngestStatus(data);
      setNewTitle("");
      setNewContent("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsIngesting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Hero Header */}
      <header className="border-b border-slate-800 pb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" /> Next.js 15 App Router on Vercel
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Upstash All-in-One Learning Hub
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
            Master <span className="text-emerald-400 font-medium">Redis</span>,{" "}
            <span className="text-amber-400 font-medium">Vector</span>, and{" "}
            <span className="text-sky-400 font-medium">QStash</span> with live,
            interactive serverless patterns running together.
          </p>
        </div>

        {/* Diagnostics Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 min-w-[280px] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-emerald-400" /> Services Status
            </span>
            <button
              onClick={fetchDiagnostics}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors p-1"
              title="Refresh status"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Redis
              </span>
              <span
                className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                  diagnostics?.redis.connected
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                    : diagnostics?.redis.configured
                    ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {diagnostics?.redis.connected
                  ? `${diagnostics.redis.latencyMs}ms`
                  : diagnostics?.redis.configured
                  ? "Configured"
                  : "Local Mode"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Vector
              </span>
              <span
                className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                  diagnostics?.vector.connected
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                    : diagnostics?.vector.configured
                    ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {diagnostics?.vector.connected
                  ? "Connected"
                  : diagnostics?.vector.configured
                  ? "Configured"
                  : "Local Mode"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> QStash
              </span>
              <span
                className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                  diagnostics?.qstash.configured
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {diagnostics?.qstash.configured ? "Ready" : "Local Mode"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Vector & Redis Search + Cache-Aside */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Semantic Search & Cache-Aside
                  </h2>
                  <p className="text-xs text-slate-400">
                    Upstash Vector (Semantic) + Upstash Redis (Sub-5ms Cache)
                  </p>
                </div>
              </div>
            </div>

            {/* Search Input Box */}
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Ask or search anything (e.g. 'How to cache data with TTL?')"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 pl-11 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
              <button
                onClick={() => handleSearch()}
                disabled={isSearching}
                className="absolute right-2.5 top-2.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Search"}
              </button>
            </div>

            {/* Quick Sample Queries */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs text-slate-500">Try sample:</span>
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
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Latency & Cache Inspection Banner */}
            {searchMeta && (
              <div
                className={`p-3.5 rounded-xl border mb-6 flex items-center justify-between text-xs animate-in fade-in duration-200 ${
                  searchMeta.source === "redis_cache"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Latency: <strong>{searchMeta.latencyMs} ms</strong>
                  </span>
                  <span className="text-slate-500">|</span>
                  <span>
                    Source:{" "}
                    <span className="font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40">
                      {searchMeta.source}
                    </span>
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {searchMeta.source === "redis_cache"
                    ? "⚡ Served instantly from Redis Cache!"
                    : "🔍 Computed by Vector index & now cached in Redis"}
                </div>
              </div>
            )}

            {/* Results Display */}
            <div className="space-y-3">
              {searchResults.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Run a search above to see semantic retrieval and sub-millisecond Redis caching in action.
                </div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                        Score: {(item.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Rate Limiting & Trending Searches */}
        <div className="space-y-6">
          {/* Rate Limiting Test Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Rate Limiter</h2>
                <p className="text-xs text-slate-400">
                  @upstash/ratelimit (5 req / 10s sliding window)
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Spam the button to test rate limiting. When the quota of 5 requests per 10s is exceeded, Upstash Redis returns an HTTP 429 Too Many Requests instantly.
            </p>

            <button
              onClick={testRateLimit}
              disabled={isHittingRateLimit}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isHittingRateLimit ? "Sending..." : "Hit Protected API Route"}
            </button>

            {rateLimitStatus && (
              <div
                className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in duration-150 ${
                  rateLimitStatus.status === 429
                    ? "bg-red-950/60 border-red-500 text-red-200"
                    : "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {rateLimitStatus.status === 429 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      HTTP 429 Rate Limit Exceeded!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Request Allowed!
                    </>
                  )}
                </div>
                <div className="text-[11px] opacity-80">
                  Remaining: {rateLimitStatus.remaining} / {rateLimitStatus.limit}
                </div>
              </div>
            )}
          </div>

          {/* Redis Trending Queries Leaderboard */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Trending Queries</h2>
                  <p className="text-xs text-slate-400">Redis Sorted Sets (ZINCRBY)</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {trending.map((item, idx) => (
                <div
                  key={item.query}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-xs"
                >
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="text-slate-500 font-mono w-4">#{idx + 1}</span>
                    {item.query}
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">
                    {item.count} hits
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: QStash Background Ingestion */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Async Document Ingestion with Upstash QStash
            </h2>
            <p className="text-xs text-slate-400">
              Serverless HTTP Message Queue + HMAC Webhook Signature Verification
            </p>
          </div>
        </div>

        <form onSubmit={handleIngest} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Document Title
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Scaling Next.js with Upstash Workflow"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="redis">Redis</option>
              <option value="vector">Vector</option>
              <option value="qstash">QStash</option>
              <option value="architecture">Architecture</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isIngesting}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Dispatch to QStash
            </button>
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Content</label>
            <textarea
              required
              rows={3}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Write document text to be vector-embedded in the background..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </form>

        {ingestStatus && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
            <div className="text-emerald-400 font-bold">
              ✓ {ingestStatus.message}
            </div>
            {ingestStatus.messageId && (
              <div className="text-slate-400 text-[11px]">
                QStash Message ID: <span className="text-sky-300">{ingestStatus.messageId}</span>
              </div>
            )}
            {ingestStatus.destinationUrl && (
              <div className="text-slate-400 text-[11px]">
                Target Webhook: <span className="text-slate-300">{ingestStatus.destinationUrl}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Guide Link */}
      <footer className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          Full architectural tutorial in{" "}
          <span className="font-mono text-slate-300">TUTORIAL.md</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Deployable to Vercel with zero code changes</span>
        </div>
      </footer>
    </div>
  );
}

