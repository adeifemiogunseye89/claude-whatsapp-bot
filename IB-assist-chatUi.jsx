import { useState, useRef, useEffect } from "react";

// ── KNOWLEDGE BASE ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are LEKKI ASSIST — the official AI public information assistant for Ibeju-Lekki Local Government Area (LGA), Lagos State, Nigeria.

Help residents, investors, and visitors with accurate, friendly information about the council and the area.

PERSONALITY: Warm, professional, proud of Ibeju-Lekki. Clear simple English. Occasionally say "Ẹ káàbọ̀" (Yoruba for welcome). Short focused paragraphs. Never ramble. Be honest when you don't know something.

ABOUT IBEJU-LEKKI LGA:
- Eastern corridor of Lagos State, along the Lekki-Epe Expressway
- Administrative centre: Igando Oloja
- Chairman: Hon. (Engr.) Abdullahi Sesan Olowa (JAJA)
- Legislature Leader: Hon. Olayinka Mojeed Oluwafemi
- Secretariat hours: Mon–Fri 8am–4pm at Igando Oloja
- Website: ibejulekki.lg.gov.ng
- Area: 455 km2 — the largest LGA in Lagos State by land area
- Population: 117,000+ at last census, much higher now due to development boom

ECONOMY & LANDMARKS:
- Dangote Refinery: One of the world's largest single-train refineries, in Ibeju-Lekki
- Lekki Free Trade Zone (LFTZ): Special economic zone with tax incentives; managed by LFTZ Authority
- Lekki Deep Seaport: Major national logistics hub
- Pan-Atlantic University: Private university in the LGA
- Beaches: Tarkwa Bay, Elegushi Beach, La Campagne Tropicana, and many others
- Real estate: One of Lagos's fastest-growing property markets

LAND AND INVESTMENT:
- The LGA does NOT sell land. Certificate of Occupancy (C of O) is handled by Lagos State Ministry of Lands
- Building permits: LGA Town Planning unit at the Secretariat
- FTZ or Dangote-area land: Contact LFTZ Authority and Lagos State government directly
- Business inquiries: LGA Secretariat or Lagos State Ministry of Commerce and Industry

RESIDENT SERVICES:
- Road or drainage complaints: LGA Works department or your ward councilor
- Healthcare: LGA-run Primary Healthcare Centres (PHCs) across all wards
- Schools: LGA manages public primary schools; secondary schools are under Lagos State
- Markets: Ibeju Market, Akodo Market, and Epe Market nearby
- Waste pickup: LAWMA at 0800-LAWMA-NG
- Security: Nearest police station or LGA security unit

COUNCIL STRUCTURE:
- Executive arm led by the Executive Chairman
- Legislative Council: elected councilors per ward, who pass local bye-laws
- Committees: Works, Health, Education, Finance, Agriculture
- Council sessions at Council Chambers Igando Oloja are open to the public

DEVELOPMENT PLANS:
- Ibeju-Lekki Model City Plan 2024–2044: 20-year blueprint for infrastructure, housing, land use and sustainability
- Power: Rehabilitation of the 33KV line from Ibeju Long Bridge to Okegun Madagbayun
- Social programs: Health outreaches, youth–police dialogues, poverty alleviation

LIMITS — be honest:
- Cannot process applications or payments — direct to the right office
- Cannot give legal advice — recommend a licensed solicitor
- Cannot verify land ownership — that is Lagos State Land Registry
- Unknown topics: "Please visit the LGA Secretariat at Igando Oloja or check ibejulekki.lg.gov.ng"

Close each response warmly.`;

// ── THEMES ─────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "sage", label: "Sage",
    bg: "#f0f5f0",
    surface: "#ffffff",
    border: "#ccdacc",
    headerBg: "#2d6a4f",
    headerText: "#ffffff",
    accent: "#2d6a4f",
    userBg: "#2d6a4f", userFg: "#ffffff",
    botBg: "#ffffff", botFg: "#1a2e1e",
    sub: "#4a7a5a",
    muted: "#8aac8a",
    sendActive: "#2d6a4f",
    sendFg: "#ffffff",
  },
  {
    id: "sand", label: "Sand",
    bg: "#faf6ee",
    surface: "#ffffff",
    border: "#e2d4b8",
    headerBg: "#6b4c0e",
    headerText: "#fff8e8",
    accent: "#9a6a18",
    userBg: "#7a5510", userFg: "#ffffff",
    botBg: "#ffffff", botFg: "#2a1e08",
    sub: "#8a6828",
    muted: "#c0a060",
    sendActive: "#9a6a18",
    sendFg: "#ffffff",
  },
  {
    id: "slate", label: "Slate",
    bg: "#edf2f8",
    surface: "#ffffff",
    border: "#c0d0e0",
    headerBg: "#1e3a5c",
    headerText: "#e8f0fa",
    accent: "#1e3a5c",
    userBg: "#1e3a5c", userFg: "#ffffff",
    botBg: "#ffffff", botFg: "#141e2a",
    sub: "#426080",
    muted: "#84a8c8",
    sendActive: "#1e3a5c",
    sendFg: "#ffffff",
  },
  {
    id: "dusk", label: "Dusk",
    bg: "#111220",
    surface: "#1a1b30",
    border: "#28294a",
    headerBg: "#0c0d1a",
    headerText: "#d8d8f0",
    accent: "#d04060",
    userBg: "#c03858", userFg: "#ffffff",
    botBg: "#1a1b30", botFg: "#c8c8e8",
    sub: "#7070a0",
    muted: "#404060",
    sendActive: "#d04060",
    sendFg: "#ffffff",
  },
  {
    id: "cocoa", label: "Cocoa",
    bg: "#fdf2e8",
    surface: "#ffffff",
    border: "#e0ccb4",
    headerBg: "#4a2c10",
    headerText: "#faeee0",
    accent: "#7a4818",
    userBg: "#5c3418", userFg: "#ffffff",
    botBg: "#ffffff", botFg: "#281808",
    sub: "#806040",
    muted: "#c09870",
    sendActive: "#7a4818",
    sendFg: "#ffffff",
  },
];

// ── QUICK QUESTIONS ────────────────────────────────────────────────────────
const QUESTIONS = [
  { icon: "👤", text: "Who is the Chairman of Ibeju-Lekki LGA?" },
  { icon: "🏗️", text: "How do I buy land in Ibeju-Lekki?" },
  { icon: "📍", text: "Where is the LGA Secretariat located?" },
  { icon: "🏭", text: "What is the Lekki Free Trade Zone?" },
  { icon: "🛣️", text: "How do I report a damaged road?" },
  { icon: "⛽", text: "Tell me about the Dangote Refinery" },
  { icon: "🏖️", text: "What beaches are in Ibeju-Lekki?" },
  { icon: "📋", text: "What is the 2024–2044 City Plan?" },
];

// ── TYPING INDICATOR ───────────────────────────────────────────────────────
function Dots({ color }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%", background: color,
          display: "inline-block",
          animation: `dotBounce 1.2s ${i * 0.16}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

// ── RENDER MARKDOWN-LITE ───────────────────────────────────────────────────
function Render({ text, bold }) {
  const lines = text.split("\n").filter(l => l.trim());
  return (
    <>
      {lines.map((line, i) => {
        const chunks = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} style={{ margin: i < lines.length - 1 ? "0 0 8px" : "0", lineHeight: 1.72 }}>
            {chunks.map((c, j) =>
              j % 2 === 1
                ? <strong key={j} style={{ fontWeight: 700, color: bold }}>{c}</strong>
                : c
            )}
          </p>
        );
      })}
    </>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────
export default function App() {
  const [tid, setTid] = useState("sage");
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(true);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const T = THEMES.find(t => t.id === tid);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text) {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    setWelcome(false);
    setError(null);
    const history = [...msgs, { role: "user", content: q }];
    setMsgs(history);
    setBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        // API returned an error response (e.g. auth, rate limit)
        const msg = json?.error?.message || `Error ${res.status}`;
        setError(msg);
        setMsgs(p => [...p, { role: "assistant", content: `⚠️ ${msg}` }]);
      } else {
        const reply = json?.content?.[0]?.text || "No response received — please try again.";
        setMsgs(p => [...p, { role: "assistant", content: reply }]);
      }
    } catch (e) {
      const msg = e?.message || "Network error";
      setError(msg);
      setMsgs(p => [...p, { role: "assistant", content: `⚠️ Network issue: ${msg}. Please check your connection and try again.` }]);
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }

  function reset() {
    setMsgs([]);
    setWelcome(true);
    setInput("");
    setError(null);
  }

  const canSend = input.trim().length > 0 && !busy;

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: T.bg,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      maxWidth: 680,
      margin: "0 auto",
      transition: "background 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        @keyframes dotBounce {
          0%,60%,100% { transform:translateY(0); opacity:.25; }
          30% { transform:translateY(-8px); opacity:1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spinR { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        textarea:focus, button:focus { outline: none; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        background: T.headerBg,
        position: "sticky", top: 0, zIndex: 30,
        boxShadow: "0 2px 20px rgba(0,0,0,0.22)",
        transition: "background 0.3s",
      }}>
        {/* Status strip */}
        <div style={{
          background: "rgba(0,0,0,0.22)",
          padding: "4px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#50e896", display: "inline-block",
              animation: "pulse 2.4s infinite",
            }} />
            <span style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 9,
              letterSpacing: 3, color: "rgba(255,255,255,0.55)", fontWeight: 600,
            }}>LIVE · AI ASSISTANT ACTIVE</span>
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
            ibejulekki.lg.gov.ng
          </span>
        </div>

        {/* Brand */}
        <div style={{ padding: "12px 18px 11px", display: "flex", alignItems: "center", gap: 13 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: "rgba(255,255,255,0.13)",
            border: "1.5px solid rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22,
          }}>🏛️</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 9,
              letterSpacing: 4, color: "rgba(255,255,255,0.42)", marginBottom: 2, fontWeight: 600,
            }}>OFFICIAL PUBLIC INFORMATION ASSISTANT</div>
            <h1 style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              margin: 0, fontSize: 21, fontWeight: 400,
              color: T.headerText, lineHeight: 1,
            }}>
              Lekki <em style={{ opacity: 0.82 }}>Assist</em>
            </h1>
            <div style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 10,
              color: "rgba(255,255,255,0.38)", marginTop: 3,
            }}>Ibeju-Lekki LGA · Lagos State, Nigeria</div>
          </div>
          {msgs.length > 0 && (
            <button onClick={reset} style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)",
              color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif",
              fontSize: 10, padding: "5px 13px", borderRadius: 20, cursor: "pointer",
              letterSpacing: 1, transition: "background 0.2s",
            }}>↺ NEW</button>
          )}
        </div>

        {/* Theme picker */}
        <div style={{
          padding: "7px 18px 10px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 9,
            color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginRight: 2,
          }}>THEME</span>
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTid(t.id)} title={t.label} style={{
              width: t.id === tid ? 28 : 18, height: 18, borderRadius: 9,
              background: t.headerBg === "#0c0d1a" ? "#d04060" : t.accent,
              border: `2px solid ${t.id === tid ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.18)"}`,
              cursor: "pointer", padding: 0,
              transition: "all 0.22s ease",
            }} />
          ))}
          <span style={{
            fontFamily: "'DM Sans',sans-serif", fontSize: 9,
            color: "rgba(255,255,255,0.42)", marginLeft: 2,
          }}>{T.label}</span>
        </div>
      </div>

      {/* ── MESSAGES ───────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "22px 18px 155px",
        display: "flex", flexDirection: "column",
      }}>

        {/* Welcome screen */}
        {welcome && (
          <div style={{ animation: "fadeUp 0.45s ease both" }}>
            {/* Hero card */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 20, padding: "24px 22px 20px",
              marginBottom: 18, boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
              transition: "background 0.3s, border-color 0.3s",
            }}>
              <div style={{ fontSize: 34, marginBottom: 12 }}>🌿</div>
              <h2 style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: 22, fontWeight: 400, lineHeight: 1.3,
                color: tid === "dusk" ? "#d8d8f0" : "#152015",
                margin: "0 0 10px",
              }}>
                {"Ẹ káàbọ̀!"}<br />
                <span style={{ color: T.accent }}>Welcome to Lekki Assist</span>
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                color: T.sub, fontSize: 13.5, lineHeight: 1.78, margin: 0,
              }}>
                Your 24/7 AI guide to Ibeju-Lekki LGA. Ask me about the council, land and investment, resident services, or anything about our fast-growing community.
              </p>
            </div>

            {/* Suggestions */}
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 9,
              letterSpacing: 3, color: T.sub, opacity: 0.6,
              marginBottom: 10,
            }}>COMMON QUESTIONS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => send(q.text)} style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: "12px 15px",
                  display: "flex", alignItems: "center", gap: 11,
                  cursor: "pointer", textAlign: "left", width: "100%",
                  boxShadow: "0 1px 5px rgba(0,0,0,0.04)",
                  animation: `fadeUp 0.4s ${i * 0.05}s ease both`,
                  transition: "all 0.2s ease",
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.accent;
                    e.currentTarget.style.transform = "translateX(5px)";
                    e.currentTarget.style.boxShadow = `0 3px 14px ${T.accent}22`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.transform = "translateX(0)";
                    e.currentTarget.style.boxShadow = "0 1px 5px rgba(0,0,0,0.04)";
                  }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{q.icon}</span>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: tid === "dusk" ? "#c0c0e0" : "#202e20", flex: 1,
                  }}>{q.text}</span>
                  <span style={{ color: T.muted, fontSize: 16 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {msgs.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} style={{
              display: "flex",
              flexDirection: isUser ? "row-reverse" : "row",
              alignItems: "flex-end",
              gap: 8, marginBottom: 14,
              animation: "fadeUp 0.28s ease both",
            }}>
              {/* Avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: isUser ? T.userBg : T.surface,
                border: `1.5px solid ${isUser ? "transparent" : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>{isUser ? "👤" : "🏛️"}</div>

              {/* Bubble */}
              <div style={{
                maxWidth: "80%",
                background: isUser ? T.userBg : T.botBg,
                border: `1px solid ${isUser ? "transparent" : T.border}`,
                borderRadius: isUser ? "15px 3px 15px 15px" : "3px 15px 15px 15px",
                padding: "11px 15px",
                color: isUser ? T.userFg : T.botFg,
                fontSize: 13.5,
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.7,
                boxShadow: isUser
                  ? `0 3px 12px ${T.userBg}30`
                  : "0 2px 8px rgba(0,0,0,0.06)",
                transition: "background 0.3s, color 0.3s",
              }}>
                <Render
                  text={m.content}
                  bold={isUser ? "rgba(255,255,255,0.95)" : T.accent}
                />
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {busy && (
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            marginBottom: 14, animation: "fadeUp 0.28s ease",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: T.surface, border: `1.5px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>🏛️</div>
            <div style={{
              background: T.botBg, border: `1px solid ${T.border}`,
              borderRadius: "3px 15px 15px 15px",
              padding: "11px 16px",
            }}>
              <Dots color={T.accent} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ──────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 680, zIndex: 20,
        background: `linear-gradient(to top, ${T.bg} 66%, transparent)`,
        padding: "10px 16px 18px",
        transition: "background 0.3s",
      }}>
        <div style={{
          background: T.surface,
          border: `1.5px solid ${T.border}`,
          borderRadius: 16,
          display: "flex", alignItems: "flex-end", gap: 8,
          padding: "10px 10px 10px 15px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
          onFocusCapture={e => {
            e.currentTarget.style.borderColor = T.accent;
            e.currentTarget.style.boxShadow = `0 4px 24px ${T.accent}20`;
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.1)";
          }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask anything about Ibeju-Lekki LGA…"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: tid === "dusk" ? "#d0d0f0" : "#182018",
              fontSize: 13.5, fontFamily: "'DM Sans', sans-serif",
              padding: 0, lineHeight: 1.6, maxHeight: 90, overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
            }}
          />
          <button
            onClick={() => send()}
            disabled={!canSend}
            style={{
              width: 38, height: 38, borderRadius: 11,
              border: "none", flexShrink: 0,
              background: canSend ? T.sendActive : T.border,
              cursor: canSend ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s ease",
              transform: canSend ? "scale(1)" : "scale(0.88)",
              boxShadow: canSend ? `0 3px 12px ${T.sendActive}40` : "none",
            }}
            onMouseEnter={e => { if (canSend) e.currentTarget.style.transform = "scale(1.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = canSend ? "scale(1)" : "scale(0.88)"; }}
          >
            {busy
              ? <div style={{
                  width: 15, height: 15,
                  border: `2px solid rgba(255,255,255,0.25)`,
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spinR 0.7s linear infinite",
                }} />
              : <span style={{ fontSize: 16, color: T.sendFg, lineHeight: 1 }}>↑</span>
            }
          </button>
        </div>
        <div style={{
          textAlign: "center", marginTop: 7,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 9, color: T.muted, opacity: 0.4, letterSpacing: 2,
        }}>
          LEKKI ASSIST · IBEJU-LEKKI LGA · PILOT DEMO
        </div>
      </div>
    </div>
  );
}
