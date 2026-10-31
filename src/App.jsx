import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import {
  Shield, Lock, CheckCircle, AlertTriangle, ChevronDown, Activity, FileKey, EyeOff, Search,
  Gauge, Fingerprint, KeyRound, Loader2, Copy, Check, Laptop, ArrowLeft, Cpu, X,
} from "lucide-react";

const API = "http://127.0.0.1:8000";
const UPI = "upi://pay?pa=7993139445@ybl&pn=ProjectArgon&am=49&cu=USD";

const card = "bg-white/80 backdrop-blur-xl border border-blue-100/80 shadow-xl shadow-blue-900/5";
const pill = "rounded-full px-6 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const badgeText = "text-xs font-bold uppercase tracking-widest text-cyan-600";
const field = "mt-1.5 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";

const STATUS = {
  ALLOWED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  HELD: "bg-amber-50 text-amber-700 ring-amber-200",
  BLOCKED: "bg-rose-50 text-rose-700 ring-rose-200",
};
const DOT = { ALLOWED: "bg-emerald-500", HELD: "bg-amber-500", BLOCKED: "bg-rose-500" };
const FADE = ["", "opacity-80", "opacity-60", "opacity-40"];

const EVENTS = [
  { agent: "sales_bot_1", action: "discounts.apply", status: "ALLOWED" },
  { agent: "aider_agent", action: "~/.aws/credentials", status: "BLOCKED" },
  { agent: "claude_code", action: "refunds.create", status: "HELD" },
  { agent: "cursor_agent", action: "ollama.generate", status: "ALLOWED" },
  { agent: "langchain_job", action: "/bin/sh -c curl", status: "BLOCKED" },
  { agent: "support_bot_2", action: "tickets.update", status: "ALLOWED" },
  { agent: "autogpt_run", action: ".env read + POST", status: "BLOCKED" },
  { agent: "claude_code", action: "payments.transfer", status: "HELD" },
];

const TOOLS = [
  "Cursor IDE Agent (Local Socket)",
  "Claude Code CLI Agent",
  "Anthropic Claude 3.5 Sonnet / Haiku API",
  "OpenAI GPT-4o / o1 Reasoning Agent",
  "DeepSeek R1 / V3 Endpoint",
  "Google Gemini 1.5 Pro / Flash Agent",
  "Aider CLI Agent",
  "Windsurf Cascade AI Agent",
  "Local Ollama Runtime (localhost:11434)",
  "vLLM Local Inference Server (localhost:8000)",
  "Meta Llama 3.3 70B (Featherless / Local Engine)",
  "Mistral Large 2 / Codestral Agent",
  "AutoGPT / LangChain Autonomous Agent",
  "CrewAI Multi-Agent Swarm",
  "GitHub Copilot Workspace Agent",
];

/* ---------- 3D cursor tilt ---------- */
function Tilt({ children, max = 8, className = "" }) {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 16 });
  const sry = useSpring(ry, { stiffness: 160, damping: 16 });
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }} className={className}>
      {children}
    </motion.div>
  );
}

function Badge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS[status]}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${DOT[status]}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${DOT[status]}`} />
      </span>
      {status}
    </span>
  );
}

/* ---------- fluid liquid mesh background ---------- */
function LiquidMeshBackground() {
  const reduce = useReducedMotion();
  const a = (v) => (reduce ? undefined : v);
  const loop = (d) => ({ duration: d, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" });
  const blobs = [
    { cls: "-left-40 -top-40 h-[42rem] w-[42rem]", color: "#bae6fd", radius: "60% 40% 30% 70% / 60% 30% 70% 40%", anim: { x: [0, 120, 40, 0], y: [0, 60, 140, 0], scale: [1, 1.2, 0.95, 1], rotate: [0, 40, -20, 0] }, d: 20, blend: "normal", op: 0.9 },
    { cls: "-right-48 top-10 h-[46rem] w-[46rem]", color: "#dbeafe", radius: "30% 70% 70% 30% / 30% 30% 70% 70%", anim: { x: [0, -140, -50, 0], y: [0, 90, -40, 0], scale: [1, 1.15, 1.25, 1], rotate: [0, -35, 25, 0] }, d: 24, blend: "normal", op: 0.95 },
    { cls: "-bottom-56 left-1/4 h-[44rem] w-[50rem]", color: "#e0f2fe", radius: "50% 50% 40% 60% / 40% 60% 50% 50%", anim: { x: [0, 100, -80, 0], y: [0, -70, 30, 0], scale: [1, 1.18, 1.05, 1], rotate: [0, 25, -30, 0] }, d: 18, blend: "normal", op: 0.95 },
    { cls: "left-1/3 top-1/4 h-[30rem] w-[30rem]", color: "#ffffff", radius: "45% 55% 65% 35% / 55% 35% 65% 45%", anim: { x: [0, -90, 70, 0], y: [0, 80, -60, 0], scale: [1, 1.3, 1.1, 1], rotate: [0, 60, -40, 0] }, d: 16, blend: "soft-light", op: 1 },
    { cls: "right-1/4 -bottom-20 h-[28rem] w-[28rem]", color: "#ffffff", radius: "55% 45% 35% 65% / 35% 55% 45% 65%", anim: { x: [0, 80, -60, 0], y: [0, -90, 20, 0], scale: [1, 1.25, 1, 1], rotate: [0, -50, 30, 0] }, d: 22, blend: "soft-light", op: 1 },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f0f9ff]">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute ${b.cls}`}
          style={{ background: b.color, borderRadius: b.radius, filter: "blur(90px)", mixBlendMode: b.blend, opacity: b.op, willChange: "transform" }}
          animate={a(b.anim)}
          transition={loop(b.d)}
        />
      ))}

      {/* Flowing shimmer wave: light refraction sweeping across */}
      <motion.div
        className="absolute inset-y-0 left-0 w-[200%]"
        initial={{ x: "-60%" }}
        animate={a({ x: ["-60%", "0%"] })}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <svg className="h-full w-full" viewBox="0 0 2000 800" preserveAspectRatio="none" fill="none">
          <defs>
            <linearGradient id="argonWave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 300 C 250 180, 500 440, 750 300 S 1250 180, 1500 300 S 1800 420, 2000 300 L2000 520 C 1750 640, 1500 400, 1250 520 S 750 640, 500 520 S 150 400, 0 520 Z" fill="url(#argonWave)" />
        </svg>
      </motion.div>
    </div>
  );
}

/* ---------- 1. header ---------- */
function Header({ manager, onToggle }) {
  const links = [["The Threat", "#threat"], ["How It Works", "#how"], ["Sandbox", "#sandbox"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];
  return (
    <header className="sticky top-0 z-30 border-b border-blue-100/70 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40"><Shield className="h-5 w-5" /></span>
          <span className="text-lg font-bold text-slate-900">Project Argon</span>
          <span className="hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200 sm:inline">v1.0 Laptop Shield</span>
        </div>
        {!manager && (
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            {links.map(([l, h]) => <a key={l} href={h} className="transition hover:text-blue-600">{l}</a>)}
          </nav>
        )}
        <button onClick={onToggle} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800">
          {manager ? "Main Landing" : "Manager Portal"}
        </button>
      </div>
    </header>
  );
}

/* ---------- auth form (used in manager portal + registration) ---------- */
function AuthForm({ manager, onBack }) {
  const [mode, setMode] = useState("register");
  const [channel, setChannel] = useState("gmail");
  const [f, setF] = useState({ name: "", org: "", role: "", contact: "" });
  const [step, setStep] = useState("form");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState({ t: "", ok: true });
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const gmail = channel === "gmail";
  const register = mode === "register";

  const post = async (path, body) => {
    const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(typeof d.detail === "string" ? d.detail : "Request failed");
    return d;
  };
  const fail = (e) => setMsg({ t: e instanceof TypeError ? "Backend not reachable. Start it with: uvicorn main:app --reload" : e.message, ok: false });

  const send = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ t: "", ok: true });
    try {
      await post("/api/v1/auth/send-otp", { email_or_phone: f.contact, channel, full_name: f.name });
      setStep("code");
      setMsg({ t: `Passcode sent via ${gmail ? "Gmail" : "WhatsApp"}. Enter the 6 digits below.`, ok: true });
    } catch (err) { fail(err); } finally { setLoading(false); }
  };
  const verify = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ t: "", ok: true });
    try {
      const d = await post("/api/v1/auth/verify-otp", { email_or_phone: f.contact, code });
      setToken(d.token); setStep("done");
    } catch (err) { fail(err); } finally { setLoading(false); }
  };

  const tab = (active) => `flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:text-blue-600"}`;

  return (
    <div>
      {manager && (
        <button onClick={onBack} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Back to Main Landing
        </button>
      )}
      <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
        {manager ? "Manager Portal" : "Deploy Argon Across Your Engineering Team"}
      </h2>
      {manager && (
        <div className="mt-6 flex rounded-xl bg-blue-50/80 p-1">
          <button type="button" onClick={() => { setMode("register"); setStep("form"); }} className={tab(register)}>New Manager Register</button>
          <button type="button" onClick={() => { setMode("signin"); setStep("form"); }} className={tab(!register)}>Already Registered Sign In</button>
        </div>
      )}
      <div className="mt-4 flex rounded-xl bg-blue-50/80 p-1" role="group" aria-label="Delivery channel">
        <button type="button" onClick={() => setChannel("gmail")} className={tab(gmail)}>Google / Gmail</button>
        <button type="button" onClick={() => setChannel("whatsapp")} className={tab(!gmail)}>Phone / WhatsApp</button>
      </div>

      {step === "done" ? (
        <div className="mt-8 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-3 font-medium text-slate-900">Verified. Session started.</p>
          <p className="mt-2 break-all rounded-xl bg-slate-900 px-4 py-3 font-mono text-xs text-sky-300">{token.slice(0, 34)}…</p>
        </div>
      ) : step === "code" ? (
        <form onSubmit={verify} className="mt-6 space-y-5">
          <label className="block text-sm font-medium text-slate-700">6-digit passcode
            <input required inputMode="numeric" maxLength={6} pattern="\d{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" className={`${field} text-center font-mono text-xl tracking-[0.5em]`} />
          </label>
          <button type="submit" disabled={loading} className={`${pill} flex w-full items-center justify-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-70`}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Verify Passcode"}
          </button>
          <button type="button" onClick={() => { setStep("form"); setCode(""); setMsg({ t: "", ok: true }); }} className="w-full text-sm text-slate-500 hover:text-blue-600">Use a different {gmail ? "Gmail" : "number"}</button>
        </form>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-5">
          {register && (
            <>
              <label className="block text-sm font-medium text-slate-700">Full Name
                <input required value={f.name} onChange={set("name")} type="text" placeholder="Your full name" className={field} />
              </label>
              <label className="block text-sm font-medium text-slate-700">Organization Name
                <input required value={f.org} onChange={set("org")} type="text" placeholder="Acme Engineering" className={field} />
              </label>
              <label className="block text-sm font-medium text-slate-700">Role / Authority Title
                <input required value={f.role} onChange={set("role")} type="text" placeholder="Security Lead" className={field} />
              </label>
            </>
          )}
          <label className="block text-sm font-medium text-slate-700">{gmail ? "Gmail" : "Phone number (with country code)"}
            <input required value={f.contact} onChange={set("contact")} type={gmail ? "email" : "tel"} placeholder={gmail ? "you@gmail.com" : "+91 98765 43210"} className={field} />
          </label>
          <button type="submit" disabled={loading} className={`${pill} flex w-full items-center justify-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-70`}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : `Send Real 6-Digit Passcode to ${gmail ? "Gmail" : "WhatsApp"}`}
          </button>
        </form>
      )}
      {msg.t && <p role="status" className={`mt-4 flex items-start gap-2 text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{!msg.ok && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}{msg.t}</p>}
    </div>
  );
}

function ManagerView({ onBack }) {
  return (
    <section className="mx-auto max-w-xl px-6 py-20">
      <div className={`${card} rounded-3xl p-8 md:p-10`}><AuthForm manager onBack={onBack} /></div>
    </section>
  );
}

/* ---------- 2. hero ---------- */
function GatewayWidget() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((v) => v + 1), 2500); return () => clearInterval(t); }, []);
  const visible = [0, 1, 2, 3].map((k) => EVENTS[(tick + 3 - k) % EVENTS.length]);
  return (
    <Tilt>
      <div className={`${card} relative rounded-3xl p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Activity className="h-4 w-4 text-blue-600" /> Live Protection</div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Watching this laptop</span>
        </div>
        <ul className="space-y-2.5">
          {visible.map((e, k) => (
            <li key={`${tick}-${k}`} className={`flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-white px-3.5 py-3 transition ${k === 0 ? "shadow-md shadow-blue-900/10" : FADE[k]}`}>
              <div className="min-w-0 font-mono text-xs text-slate-700">
                <span className="font-semibold text-slate-900">{e.agent}</span><span className="text-blue-500"> → </span><span className="truncate">{e.action}</span>
              </div>
              <Badge status={e.status} />
            </li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50/80 p-3"><div className="font-mono text-lg font-bold text-blue-700">0.38ms</div><div className="text-xs text-slate-500">Time to check each AI action</div></div>
          <div className="rounded-xl bg-rose-50/80 p-3"><div className="font-mono text-lg font-bold text-rose-600">100%</div><div className="text-xs text-slate-500">Secret leaks stopped</div></div>
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">{(18240 + tick * 7).toLocaleString()} AI actions checked this session</p>
      </div>
    </Tilt>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-20 lg:grid-cols-2">
      <div>
        <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">Stop AI tools from silently leaking your company secrets.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Developers use AI tools like Cursor, Claude, and Ollama every day. Argon automatically detects and hides passwords, API keys, and sensitive data on your laptop before they ever leave your computer.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="#sandbox" className={`${pill} bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700`}>Try Security Demo</a>
          <a href="#how" className={`${pill} border border-blue-100 bg-white/70 text-slate-800 backdrop-blur-xl hover:border-blue-300`}>How Argon Protects You</a>
        </div>
      </div>
      <GatewayWidget />
    </section>
  );
}

/* ---------- 3. problem ---------- */
function Problem() {
  const items = [
    { i: Search, t: "AI Scans Private Files", d: "AI coding agents automatically read local files like .env and AWS credentials without asking.", m: "Reads secrets silently", from: { x: "108%", rotate: -7 } },
    { i: EyeOff, t: "Traditional Firewalls Are Blind", d: "Standard corporate firewalls cannot see what AI tools are doing locally on a developer's machine.", m: "Invisible to IT", from: { x: "0%", rotate: 2 } },
    { i: FileKey, t: "Blocking AI Kills Productivity", d: "Blocking AI tools completely frustrates developers. Companies need safety, not total blocks.", m: "Safety, not bans", from: { x: "-108%", rotate: 7 } },
  ];
  return (
    <section id="threat" className="mx-auto max-w-7xl scroll-mt-24 overflow-hidden px-6 py-20">
      <h2 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900">The Real Threat Companies Face Today</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map(({ i: Icon, t, d, m, from }, k) => (
          <motion.div key={t} initial={{ ...from, scale: 0.92, opacity: 0.6 }} whileInView={{ x: 0, rotate: 0, scale: 1, opacity: 1 }} viewport={{ once: true, amount: 0.5 }}
            transition={{ type: "spring", stiffness: 70, damping: 16, delay: k === 1 ? 0 : 0.15 }} style={{ zIndex: k === 1 ? 2 : 1 }} className={`${card} rounded-3xl p-7`}>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500"><Icon className="h-5 w-5" /></span>
            <h3 className="mt-5 text-lg font-semibold text-slate-900">{t}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" /> {m}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. how it works ---------- */
function HowItWorks() {
  const steps = [
    { i: Laptop, t: "Local Catch", d: "Intercepts AI requests right on your computer." },
    { i: Search, t: "Instant Smart Scan", d: "Finds passwords and secret keys in less than 5 milliseconds." },
    { i: Gauge, t: "Risk Scoring", d: "Measures if an AI tool is acting suspiciously or spawning background shells." },
    { i: Fingerprint, t: "Automatic Scrubbing", d: "Replaces real keys with safe tags so the AI model never sees raw secrets." },
    { i: KeyRound, t: "Zero-Knowledge Logs", d: "Encrypts alerts directly in your browser. Our server NEVER sees your secrets." },
  ];
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.65"] });
  const [progress, setProgress] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setProgress(v));
  const path = "M 100 50 C 160 -10, 240 110, 300 50 S 440 -10, 500 50 S 640 110, 700 50 S 840 -10, 900 50";
  return (
    <section id="how" ref={ref} className="mx-auto max-w-7xl scroll-mt-24 px-6 py-20">
      <h2 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900">How Argon Keeps Your Secrets Safe in 5 Simple Steps</h2>
      <div className="relative mt-16">
        <svg aria-hidden className="absolute left-0 top-0 hidden h-14 w-full overflow-visible lg:block" viewBox="0 0 1000 100" preserveAspectRatio="none" fill="none">
          <path d={path} stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 8" vectorEffect="non-scaling-stroke" />
          <motion.path d={path} stroke="#2563eb" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ pathLength: scrollYProgress }} />
        </svg>
        <ol className="relative grid gap-8 lg:grid-cols-5">
          {steps.map(({ i: Icon, t, d }, k) => {
            const reached = progress >= k / 4 - 0.03;
            return (
              <li key={t} className="flex flex-col items-center text-center">
                <motion.span animate={{ scale: reached ? 1 : 0.5, opacity: reached ? 1 : 0.35 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/40 ring-8 ring-blue-50"><Icon className="h-6 w-6" /></motion.span>
                <motion.div animate={{ opacity: reached ? 1 : 0.4, y: reached ? 0 : 12 }} transition={{ duration: 0.4 }} className={`${card} mt-6 w-full rounded-2xl p-5`}>
                  <div className="text-xs font-semibold text-blue-600">Step {k + 1}</div>
                  <h3 className="mt-1 font-semibold text-slate-900">{t}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------- 5. live sandbox (backend first, 2.5s timeout, air-gapped fallback) ---------- */
const SAMPLE = `# deploy/bootstrap.py - agent bootstrapping
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
conn = "postgres://svc_admin:S3nsit1ve-Pass@db.internal:5432/prod"`;

const SALT = crypto.getRandomValues(new Uint8Array(16));
async function fingerprint(secret) {
  const key = await crypto.subtle.importKey("raw", SALT, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(secret));
  return "#sha256:" + Array.from(new Uint8Array(sig)).slice(0, 3).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const RULES = [
  { type: "PRIVATE_KEY", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g },
  { type: "AWS", re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { type: "AWS", re: /(?<=SECRET_ACCESS_KEY\s*=\s*["']?)[A-Za-z0-9/+=]{40}/g },
  { type: "GITHUB", re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g },
  { type: "STRIPE", re: /\b(?:sk|rk)_live_[0-9a-zA-Z]{24,}\b/g },
  { type: "SLACK", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
  { type: "JWT", re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { type: "DB", re: /(?<=\/\/[^:\s]+:)[^@\s]+(?=@)/g },
];
async function scanLocal(text) {
  let redacted = text;
  const tags = [];
  const t0 = performance.now();
  for (const rule of RULES) {
    for (const secret of [...redacted.matchAll(rule.re)].map((m) => m[0])) {
      const fp = await fingerprint(secret);
      const tag = `<REDACTED: ${rule.type}_${fp}>`;
      redacted = redacted.split(secret).join(tag);
      tags.push({ tag, fp, type: rule.type });
    }
  }
  const n = tags.length;
  const score = n === 0 ? 5 : Math.min(100, 30 + 20 * n);
  const kinds = new Set(tags.map((t) => t.type));
  return {
    redacted, tags, score, ms: performance.now() - t0, live: false,
    status: score >= 50 ? "QUARANTINED" : "CLEAR",
    label: score >= 70 ? "CRITICAL EXFILTRATION RISK" : n > 0 ? "ELEVATED RISK" : "CLEAR",
    advice: n === 0 ? "No secrets found; this payload is safe to send."
      : kinds.has("PRIVATE_KEY") ? "Revoke and regenerate the exposed private key, then replace it everywhere it was deployed."
      : kinds.has("AWS") ? "Revoke the exposed AWS key immediately and migrate the workload to short-lived IAM roles."
      : "Rotate the exposed credential and store it in a secrets manager instead of source or prompts.",
  };
}

function Sandbox({ target }) {
  const [proc, setProc] = useState("cursor_agent");
  const [text, setText] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const run = async () => {
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const t0 = performance.now();
    let r;
    try {
      const resp = await fetch(`${API}/api/v1/scan-payload`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
        body: JSON.stringify({ payload: text, source_process: `${proc}_p3891`, target_ai_tool: target }),
      });
      if (!resp.ok) throw new Error("bad response");
      const d = await resp.json();
      r = {
        redacted: d.sanitized_payload,
        tags: d.detections.map((x) => ({ tag: x.tag, fp: x.fingerprint, type: x.type })),
        score: d.risk_score, label: d.risk_label, advice: d.featherless_remediation,
        status: d.process_status, ms: d.latency_ms, live: true,
      };
    } catch {
      r = await scanLocal(text);
    } finally {
      clearTimeout(timer);
    }
    r.rtt = performance.now() - t0;
    setRes(r);
    setLoading(false);
  };
  const tagText = res ? (res.tags.length ? res.tags.map((t) => t.tag).join("\n") : "none found") : "<REDACTED: AWS_#8f9a2b>";
  const fpText = res ? (res.tags.length ? res.tags.map((t) => t.fp).join("  ") : "—") : "#8f9a2b";
  const riskText = res ? `${res.score}/100 (${res.label})` : "90/100 (CRITICAL EXFILTRATION RISK)";
  const advice = res ? res.advice : "Revoke AWS secret key immediately. Migrate database credentials to environment vault.";
  const critical = !res || res.score >= 70;
  const types = res ? [...new Set(res.tags.map((t) => t.type))].join(", ") || "none" : "AWS, DB";
  const status = res ? res.status : "QUARANTINED";
  return (
    <section id="sandbox" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
      <div className="max-w-2xl">
        <div className={badgeText}>Live Sandbox</div>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Scan &amp; audit a real payload</h2>
        <p className="mt-3 text-slate-600">Paste agent context, pick the source process, and watch the engine sanitize secrets, fingerprint the payload and hand back Featherless AI remediation.</p>
      </div>
      <Tilt max={3} className="mt-10">
        <div className={`${card} grid gap-6 rounded-3xl p-6 lg:grid-cols-2`}>
          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Payload Inspector</div>
            <label className="block text-sm font-medium text-slate-700">Source process
              <select value={proc} onChange={(e) => setProc(e.target.value)} className={field}>
                {["cursor_agent", "aider_cli", "claude_code", "python_script"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm font-medium text-slate-700">Simulated payload / prompt
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} spellCheck={false} className={`${field} resize-none font-mono text-xs leading-6`} />
            </label>
            <button onClick={run} disabled={loading} className={`${pill} mt-5 inline-flex items-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-70`}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</> : <><CheckCircle className="h-4 w-4" /> Scan &amp; Audit</>}
            </button>
          </div>
          <div className="rounded-2xl bg-slate-900 p-5 shadow-inner">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Response Console</span>
              <span className="truncate font-mono text-xs text-slate-500">{proc} → {target.split(" (")[0]}</span>
            </div>
            <dl className="space-y-4 font-mono text-xs">
              <div><dt className="text-slate-500">Intercepted status</dt><dd className="mt-1 whitespace-pre-wrap break-all text-cyan-300">{tagText}</dd></div>
              <div><dt className="text-slate-500">HMAC fingerprint hash</dt><dd className="mt-1 break-all text-cyan-300">{fpText}</dd></div>
              <div><dt className="text-slate-500">Detection types</dt><dd className="mt-1 text-cyan-300">{types}</dd></div>
              <div><dt className="text-slate-500">Process status</dt><dd className={`mt-1 font-semibold ${status === "QUARANTINED" ? "text-rose-400" : "text-emerald-400"}`}>{status}</dd></div>
              <div><dt className="text-slate-500">Risk score</dt><dd className={`mt-1 font-semibold ${critical ? "text-rose-400" : "text-emerald-400"}`}>{riskText}</dd></div>
              <div><dt className="text-slate-500">AI remediation advice</dt><dd className="mt-1 leading-5 text-slate-200">{advice}</dd></div>
              {res && res.tags.length > 0 && (
                <div><dt className="text-slate-500">Sanitized payload sent to AI</dt><dd className="mt-1 whitespace-pre-wrap break-all rounded-lg bg-slate-950/70 p-3 leading-5 text-emerald-300">{res.redacted}</dd></div>
              )}
              {res && <div className="text-slate-500">Engine: {res.live ? "Python backend" : "air-gapped browser engine (backend offline)"} · scan {res.ms.toFixed(2)} ms · round-trip {res.rtt.toFixed(0)} ms</div>}
            </dl>
          </div>
        </div>
      </Tilt>
    </section>
  );
}

/* ---------- 6. agent gateway selector ---------- */
function Gateway({ target, setTarget }) {
  return (
    <section id="gateway" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-12">
      <div className={`${card} rounded-3xl p-8`}>
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Cpu className="h-5 w-5" /></span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Agent Gateway &amp; AI Model Selector</h2>
            <p className="mt-1 text-slate-600">Choose which AI tool or endpoint Project Argon should govern and protect.</p>
          </div>
        </div>
        <label className="mt-6 block text-sm font-medium text-slate-700">Target AI Tool
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={field}>
            {TOOLS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          <span>Argon is guarding: <strong>{target}</strong></span>
        </div>
      </div>
    </section>
  );
}

/* ---------- 7. registration (above pricing) ---------- */
function Access() {
  return (
    <section id="access" className="mx-auto max-w-xl scroll-mt-24 px-6 py-20">
      <motion.div initial={{ scale: 0.85, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true, amount: 0.3 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }} className={`${card} rounded-3xl p-8 md:p-10`}>
        <AuthForm manager={false} />
      </motion.div>
    </section>
  );
}

/* ---------- 8. pricing + QR modal ---------- */
function PayModal({ open, onClose }) {
  const [txn, setTxn] = useState("");
  const [msg, setMsg] = useState({ t: "", ok: true });
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  const verify = async () => {
    setLoading(true); setMsg({ t: "", ok: true });
    try {
      const r = await fetch(`${API}/api/v1/payment/verify`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transaction_id: txn }) });
      const d = await r.json();
      if (!r.ok) throw new Error(typeof d.detail === "string" ? d.detail : "Verification failed");
      setMsg({ t: `Status: ${d.status}. Tier: ${d.tier}.`, ok: true });
    } catch (e) {
      setMsg({ t: e instanceof TypeError ? "Backend not reachable. Start it with: uvicorn main:app --reload" : e.message, ok: false });
    } finally { setLoading(false); }
  };
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <motion.div role="dialog" aria-modal="true" aria-label="Pay $49" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm rounded-3xl border border-blue-100/80 bg-white/90 p-7 text-center shadow-2xl backdrop-blur-xl">
            <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            <h3 className="text-xl font-bold text-slate-900">Pay $49 · Pro Developer</h3>
            <p className="mt-1 text-sm text-slate-500">Scan with any UPI app</p>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(UPI)}`} alt="UPI payment QR code" width="220" height="220" className="mx-auto mt-5 rounded-2xl border border-blue-100 bg-white p-2" />
            <input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="Transaction ID" aria-label="Transaction ID" className={`${field} text-center`} />
            <button onClick={verify} disabled={loading || txn.trim().length < 6} className={`${pill} mt-4 flex w-full items-center justify-center gap-2 bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50`}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking...</> : "Verify Payment Status"}
            </button>
            {msg.t && <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.t}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Pricing({ onPro }) {
  const plans = [
    { name: "Registration Free", price: "$0", unit: "forever", cta: "Register Access", featured: false, f: ["3 free sandbox scans", "Full DLP rule engine", "Zero-knowledge HMAC fingerprints", "RAM loopback interception"] },
    { name: "Pro Developer", price: "$49", unit: "month", cta: "Go Pro", featured: true, f: ["Unlimited RAM inspections", "Featherless AI auditing", "Live threat stream + webhooks", "24h velocity analytics", "Priority rule updates"] },
    { name: "Enterprise Boundary", price: "Custom", unit: "", cta: "Talk to us", featured: false, f: ["On-prem loopback fleet", "SSO + audit exports", "Custom DLP rulesets", "Dedicated zero-trust review"] },
  ];
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.15 } } };
  const item = { hidden: { y: 60, opacity: 0 }, show: { y: 0, opacity: 1, transition: { duration: 0.6 } } };
  const light = "border border-blue-100 bg-blue-50/70 text-blue-700 hover:border-blue-300";
  return (
    <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className={badgeText}>Pricing</div>
        <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">Start free, scale to your boundary</h2>
        <p className="mt-3 text-slate-600">Every tier runs the same deterministic engine — you're only choosing how much traffic it guards.</p>
      </div>
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="mt-14 grid items-center gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <motion.div key={p.name} variants={item} className={`${card} relative rounded-3xl p-8 ${p.featured ? "py-12 shadow-2xl shadow-blue-600/20 ring-2 ring-blue-500/60" : ""}`}>
            {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold tracking-wider text-white shadow-lg">MOST POPULAR</span>}
            <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight text-slate-900">{p.price}</span>
              {p.unit && <span className="text-sm text-slate-500">/ {p.unit}</span>}
            </div>
            <ul className="mt-6 space-y-3">
              {p.f.map((x) => <li key={x} className="flex items-start gap-2.5 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {x}</li>)}
            </ul>
            {p.featured ? (
              <button onClick={onPro} className={`${pill} mt-8 block w-full text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-700`}>{p.cta}</button>
            ) : (
              <a href="#access" className={`${pill} mt-8 block text-center ${light}`}>{p.cta}</a>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------- 9. faq ---------- */
function FAQ() {
  const [open, setOpen] = useState(0);
  const q = [
    ["Do I have to install anything risky on my computer?", "No. Argon does not need special security certificates, so your normal tools like git, npm and pip keep working."],
    ["Does Argon slow down my AI tools?", "No. Hiding a secret takes less than 5 milliseconds, which is far too fast to notice. Deeper checks run quietly in the background."],
    ["Where are my secrets stored?", "Nowhere. Real secrets are removed from memory right away. Our server only keeps locked alerts that only you can open in your own browser."],
    ["Can it work without the internet?", "Yes. Run Argon fully offline with Ollama and nothing ever leaves your laptop."],
  ];
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-20">
      <h2 className="text-center text-4xl font-bold tracking-tight text-slate-900">Frequently Asked Questions</h2>
      <div className="mt-10 space-y-3">
        {q.map(([t, a], k) => (
          <div key={t} className={`${card} rounded-2xl`}>
            <button onClick={() => setOpen(open === k ? -1 : k)} aria-expanded={open === k} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-semibold text-slate-900">
              {t}<ChevronDown className={`h-5 w-5 shrink-0 text-blue-600 transition-transform duration-300 ${open === k ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-all duration-300 ${open === k ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden"><p className="px-6 pb-5 text-sm leading-7 text-slate-600">{a}</p></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 10. footer with team credits ---------- */
function Footer() {
  const team = [
    ["SYED SHUJA MUSTAFA", "+91 79931 39445"],
    ["SAIRA AQLEEM", "+91 70327 51679"],
    ["MOHAMMED OSMAN", "+91 95154 75660"],
    ["MOHAMMED NEHAL SHAIK", "+91 63019 37122"],
    ["MOHAMMADI BEGUM", "+91 63033 74373"],
  ];
  return (
    <footer className="border-t border-blue-100/70 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-6 py-10 md:flex-row">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40"><Shield className="h-5 w-5" /></span>
            <span className="text-lg font-bold text-slate-900">Project Argon</span>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-500">Architected by:</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-slate-600">
            {team.map(([n, p]) => <li key={n}>{n} - {p}</li>)}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <a href="#" className="hover:text-blue-600">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600">Terms of Service</a>
            <a href="#" className="hover:text-blue-600">Data Processing Addendum</a>
          </div>
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-600"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> All Protection Systems Operational</span>
          <span className="text-xs text-slate-400">© 2026 Project Argon. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- opening split preloader ---------- */
function SplittingPreloader({ onDone }) {
  const [count, setCount] = useState(0);

  // lock page scroll while the preloader is on screen
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // fast 0 -> 100 counter (~900ms), then trigger the split
  useEffect(() => {
    const start = performance.now();
    const total = 900;
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / total);
      setCount(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p >= 1) {
        clearInterval(id);
        setTimeout(onDone, 150);
      }
    }, 16);
    return () => clearInterval(id);
  }, [onDone]);

  const ease = [0.77, 0, 0.175, 1];
  const content = (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/40"><Shield className="h-5 w-5" /></span>
        <span className="text-2xl font-bold tracking-[0.3em] text-slate-900">PROJECT ARGON</span>
      </div>
      <div className="font-mono text-6xl font-extrabold tabular-nums text-blue-600">{count}%</div>
    </div>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" role="status" aria-label="Loading Project Argon">
      {/* top half */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 overflow-hidden bg-white"
        initial={{ y: 0 }}
        exit={{ y: "-100%", transition: { duration: 0.9, ease } }}
      >
        {content}
      </motion.div>
      {/* bottom half: same content, shifted up so the two halves line up */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden bg-white"
        initial={{ y: 0 }}
        exit={{ y: "100%", transition: { duration: 0.9, ease } }}
      >
        <div className="-translate-y-1/2">{content}</div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [isManagerView, setIsManagerView] = useState(false);
  const [target, setTarget] = useState(TOOLS[0]);
  const [payOpen, setPayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const toggle = () => { setIsManagerView((v) => !v); window.scrollTo({ top: 0 }); };
  return (
    <div className="relative min-h-screen font-sans text-slate-900 antialiased">
      <AnimatePresence>
        {isLoading && <SplittingPreloader onDone={() => setIsLoading(false)} />}
      </AnimatePresence>
      <LiquidMeshBackground />
      <Header manager={isManagerView} onToggle={toggle} />
      {isManagerView ? (
        <ManagerView onBack={toggle} />
      ) : (
        <main>
          <Hero />
          <Problem />
          <HowItWorks />
          <Sandbox target={target} />
          <Gateway target={target} setTarget={setTarget} />
          <Access />
          <Pricing onPro={() => setPayOpen(true)} />
          <FAQ />
        </main>
      )}
      <Footer />
      <PayModal open={payOpen} onClose={() => setPayOpen(false)} />
    </div>
  );
}