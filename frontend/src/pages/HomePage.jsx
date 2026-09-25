import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import THEMES from "../data/themes.js";
import STAGES from "../data/stages.js";
import PERSONAS from "../data/personas.js";
import {
  loadAttempts,
  loadProfile,
  loadStreak,
  computeStreakState,
  todayStr,
} from "../data/progress.js";
import {
  loadDailyChallenge,
  hasDoneToday,
} from "../data/dailyChallenge.js";
import { loadLeague } from "../data/progress.js";
import INITIAL_LEAGUE_DATA from "../data/leagueData.js";
import PageTransition from "../components/PageTransition.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import "./HomePage.css";

// ─── Compute player rank from league data ────────────────────────────────────
function computePlayerRank(attempts) {
  const league = loadLeague(INITIAL_LEAGUE_DATA);
  const correct = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
  const playerScore = Math.min(100, accuracy);
  const withScores = league.map((u) => {
    if (u.isPlayer) return { ...u, score: playerScore };
    const npcAcc = Math.min(100, 40 + Math.round((u.coins / 5000) * 60));
    return { ...u, score: npcAcc };
  });
  const sorted = [...withScores].sort((a, b) => b.score - a.score || b.coins - a.coins);
  const idx = sorted.findIndex((u) => u.isPlayer);
  return idx >= 0 ? idx + 1 : 30;
}

// ─── Count attempts completed today ──────────────────────────────────────────
function countTodayAttempts(attempts) {
  const today = todayStr();
  return attempts.filter((a) => a.savedAt && a.savedAt.startsWith(today)).length;
}

// ─── Stage detail data for quest map tooltips ────────────────────────────────
const STAGE_META = [
  { xp: 30,  difficulty: "Beginner",   questions: 4, minutes: 5,  desc: "Core JS fundamentals — variables, types, and basic syntax." },
  { xp: 60,  difficulty: "Explorer",   questions: 3, minutes: 4,  desc: "Control flow, loops, and function basics." },
  { xp: 120, difficulty: "Challenger", questions: 3, minutes: 5,  desc: "Scope, closures, and higher-order functions." },
  { xp: 200, difficulty: "Expert",     questions: 3, minutes: 6,  desc: "Async patterns, promises, and ES6+ features." },
  { xp: 300, difficulty: "Boss",       questions: 2, minutes: 8,  desc: "Full concept synthesis. Boss-level bonus rewards." },
];

// ─── Story theme extended metadata ───────────────────────────────────────────
const THEME_META = {
  cyber:     { tag: "Sci-Fi Thriller", quote: '"The city runs on code — and so do you."', bonus: "2×", difficulty: "Intermediate" },
  space:     { tag: "Space Adventure", quote: '"Every orbit decays without the right logic."', bonus: "1.5×", difficulty: "Beginner" },
  detective: { tag: "Mystery Noir",    quote: '"The algorithm was stolen. Only you can crack the case."', bonus: "2.5×", difficulty: "Advanced" },
};

// ─── Persona extended metadata ───────────────────────────────────────────────
const PERSONA_META = {
  scientist: { archetype: "Evidence-based Thinker", perk: "Unlock bonus XP when your explanation includes data and causes.", quote: '"Hypothesize. Test. Conclude."' },
  detective: { archetype: "Deductive Reasoner",     perk: "Chapter unlock requires elimination-style deduction keywords.",  quote: '"Every clue leads somewhere."' },
  wizard:    { archetype: "Analogical Thinker",      perk: "Metaphors and analogies satisfy explanation checks creatively.", quote: '"Ancient wisdom speaks through you."' },
  warrior:   { archetype: "Speed Champion",          perk: "Answers under 30s earn style points with direct language.",     quote: '"No hesitation. Strike fast."' },
  sage:      { archetype: "Patient Teacher",         perk: "Simple beginner-friendly language earns full explanation XP.",  quote: '"True wisdom is teaching others."' },
};

// ─── Logout confirmation modal ────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  useEffect(() => { confirmRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);
  return (
    <div className="ql-modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm logout" onClick={onCancel}>
      <div className="ql-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="ql-modal-title">Sign Out?</h3>
        <p className="ql-modal-body">Your progress is saved locally. You can return any time.</p>
        <div className="ql-modal-actions">
          <button className="ql-modal-confirm" ref={confirmRef} onClick={onConfirm}>Yes, Sign Out</button>
          <button className="ql-modal-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Stage detail modal ───────────────────────────────────────────────────────
function StageModal({ stage, meta, stageIndex, isUnlocked, isCompleted, selectedPersona, onClose, onStart }) {
  const persona = PERSONAS.find((p) => p.id === selectedPersona) ?? PERSONAS[0];
  const closeRef = useRef(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="ql-modal-backdrop" role="dialog" aria-modal="true" aria-label={`${stage.name} stage detail`} onClick={onClose}>
      <div className="ql-modal-box ql-modal-box--stage" onClick={(e) => e.stopPropagation()}>
        <button className="ql-modal-close" ref={closeRef} onClick={onClose} aria-label="Close">✕</button>
        <div className="ql-stage-modal-header" style={{ borderColor: stage.color }}>
          <span className="ql-stage-modal-emoji" style={{ color: stage.color }}>
            {isCompleted ? "✅" : isUnlocked ? stage.emoji : "🔒"}
          </span>
          <div>
            <h3 className="ql-stage-modal-title" style={{ color: stage.color }}>
              Stage {stageIndex + 1} — {stage.name}
            </h3>
            <span className="ql-stage-modal-diff">{meta.difficulty}</span>
          </div>
        </div>
        <p className="ql-stage-modal-desc">{meta.desc}</p>
        <div className="ql-stage-modal-stats">
          <div className="ql-stage-modal-stat">
            <span className="ql-stage-modal-stat-val">{meta.xp}</span>
            <span className="ql-stage-modal-stat-lbl">XP Reward</span>
          </div>
          <div className="ql-stage-modal-stat">
            <span className="ql-stage-modal-stat-val">{meta.questions}</span>
            <span className="ql-stage-modal-stat-lbl">Questions</span>
          </div>
          <div className="ql-stage-modal-stat">
            <span className="ql-stage-modal-stat-val">~{meta.minutes}m</span>
            <span className="ql-stage-modal-stat-lbl">Est. Time</span>
          </div>
        </div>
        <div className="ql-stage-modal-persona">
          <span>{persona.emoji} Playing as <strong>{persona.name}</strong></span>
          <span className="ql-stage-modal-perk">{PERSONA_META[persona.id]?.perk}</span>
        </div>
        {isUnlocked && !isCompleted && (
          <button className="ql-stage-modal-start primary" onClick={onStart}>
            ▶ Start Stage Quiz
          </button>
        )}
        {isCompleted && (
          <button className="ql-stage-modal-start secondary" onClick={onStart}>
            🔁 Replay Stage
          </button>
        )}
        {!isUnlocked && (
          <p className="ql-stage-modal-locked">🔒 Complete the previous stage to unlock.</p>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HomePage Component
// ═════════════════════════════════════════════════════════════════════════════
function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ── Data state ─────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [dc, setDc] = useState(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem("ql_selected_theme") ?? THEMES[0].id;
  });
  const [selectedPersona, setSelectedPersona] = useState(() => {
    return localStorage.getItem("ql_selected_persona") ?? PERSONAS[0].id;
  });
  const [mode, setMode] = useState("story"); // "story" | "persona"
  const [soundOn, setSoundOn] = useState(() => {
    return localStorage.getItem("ql_sound") !== "off";
  });
  const [showLogout, setShowLogout] = useState(false);
  const [activeStageModal, setActiveStageModal] = useState(null); // stage index or null
  const [expandedStory, setExpandedStory] = useState(null);
  const [expandedPersona, setExpandedPersona] = useState(null);
  const [expandedStage, setExpandedStage] = useState(null);

  // ── Load data on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    setProfile(loadProfile());
    setStreak(loadStreak());
    setAttempts(loadAttempts());
    setDc(loadDailyChallenge());
  }, []);

  // ── Persist theme/persona selections ──────────────────────────────────────
  const handleThemeSelect = (id) => {
    setSelectedTheme(id);
    localStorage.setItem("ql_selected_theme", id);
  };
  const handlePersonaSelect = (id) => {
    setSelectedPersona(id);
    localStorage.setItem("ql_selected_persona", id);
  };
  const handleSoundToggle = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem("ql_sound", next ? "on" : "off");
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalXp = profile?.totalXp ?? 0;
  const playerLevel = Math.max(1, Math.floor(totalXp / 100) + 1);
  const totalCoins = profile?.totalCoins ?? 0;
  const maxXp = playerLevel * 100;
  const xpPct = Math.min(Math.round(((totalXp % 100) / 100) * 100), 100);
  const currentStreakCount = streak?.currentStreak ?? 0;
  const streakState = streak ? computeStreakState(streak) : null;
  const isAtRisk = streakState?.state === "at-risk";
  const mistakeCount = JSON.parse(localStorage.getItem("ql_mistakes") ?? "[]").length;
  const dcDoneToday = dc ? hasDoneToday(dc) : false;
  const playerRank = attempts.length ? computePlayerRank(attempts) : null;
  const todayCount = countTodayAttempts(attempts);
  const dailyGoal = 5;
  const dailyPct = Math.min(Math.round((todayCount / dailyGoal) * 100), 100);

  const currentStageId = profile?.currentStageId ?? "beginner";
  const completedIds = profile?.completedStageIds ?? [];
  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStageId);

  const activeTheme = THEMES.find((t) => t.id === selectedTheme) ?? THEMES[0];
  const activePersona = PERSONAS.find((p) => p.id === selectedPersona) ?? PERSONAS[0];

  function isStageUnlocked(stage) {
    if (stage.unlockAfter === null) return true;
    return completedIds.includes(stage.unlockAfter);
  }
  function isStageCompleted(stage) {
    return completedIds.includes(stage.id);
  }

  const handleStartQuest = () => {
    // Pass stageId so /api/question?stageId= uses the correct question pool
    navigate(`/mission?theme=${selectedTheme}&persona=${selectedPersona}&stageId=${currentStageId}`);
  };

  const handleStageClick = (idx) => {
    setActiveStageModal(idx);
  };

  const handleStartStage = (stage) => {
    // Pass all three params: stageId for question pool, persona for explanation style, theme for narrative
    navigate(`/mission?stageId=${stage.id}&persona=${selectedPersona}&theme=${selectedTheme}`);
    setActiveStageModal(null);
  };

  const handleLogoutConfirm = async () => {
    setShowLogout(false);
    try {
      await logout();
    } catch (err) {
      console.error("Logout error", err);
    }
    navigate("/");
  };

  // ── Daily target motivational message ─────────────────────────────────────
  const dailyMotivation =
    todayCount === 0 ? "Start your first quest today!" :
    todayCount < 2   ? "Good start — keep going!" :
    todayCount < dailyGoal ? "More than halfway there! 🔥" :
    "Daily goal reached! 🏆 Outstanding!";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageTransition className="ql-dashboard">

      {/* ══════════════════════════════ LEFT COLUMN ═══════════════════════════ */}
      <main className="ql-arena" aria-label="Main game arena">

        {/* ── Hero Header — brand row + hero text ──────────────────────────── */}
        <div className="ql-hero-header">
          {/* Brand + stats row */}
          <div className="ql-hero-brand-row">
            <div className="ql-hero-brand">
              <span className="ql-hero-brand-icon" aria-hidden="true">⚔️</span>
              <span className="ql-hero-brand-name">QuestLearn</span>
            </div>
            <div className="ql-hero-stat-pills">
              {/* Streak */}
              <div
                className="ql-hero-stat-pill ql-hero-stat-pill--fire"
                title={isAtRisk ? "⚠️ Streak at risk! Complete a quest today to save it." : `${currentStreakCount}-day streak active.`}
              >
                <span aria-hidden="true">🔥</span>
                <span className="ql-hero-stat-val">{currentStreakCount}</span>
                <span className="ql-hero-stat-lbl">streak</span>
              </div>
              {/* XP */}
              <div
                className="ql-hero-stat-pill ql-hero-stat-pill--xp"
                title={`${totalXp} XP earned. Next milestone: ${maxXp} XP.`}
              >
                <span aria-hidden="true">⚡</span>
                <span className="ql-hero-stat-val">{totalXp.toLocaleString()}</span>
                <span className="ql-hero-stat-lbl">XP</span>
              </div>
              {/* Sound toggle — local UI preference only */}
              <button
                className={`ql-sound-btn ${soundOn ? "" : "ql-sound-btn--off"}`}
                onClick={handleSoundToggle}
                aria-label={soundOn ? "Mute sound" : "Unmute sound"}
                title="Sound — local UI preference only"
              >
                {soundOn ? "🔊" : "🔇"}
              </button>
            </div>
          </div>

          {/* Hero heading + description */}
          <h1 className="ql-hero-heading">
            Turn Every Lesson Into Your{" "}
            <span className="ql-hero-accent">Next Quest</span>
          </h1>
          <p className="ql-hero-desc">
            Complete missions, earn XP, protect your daily streak, and learn from every mistake — one quest at a time.
          </p>
        </div>

        {/* ── Active Track bar ─────────────────────────────────────────────── */}
        <div className="ql-track-bar">
          <div className="ql-track-info">
            <span className="ql-track-icon" aria-hidden="true">📘</span>
            <div className="ql-track-text">
              <span className="ql-track-label">Active Track</span>
              <span className="ql-track-name">JavaScript Fundamentals</span>
            </div>
            <span className="ql-track-progress-text">
              {completedIds.length}/{STAGES.length} stages
            </span>
          </div>
          <div className="ql-track-bar-wrap" role="progressbar" aria-valuenow={completedIds.length} aria-valuemax={STAGES.length} aria-label="Track progress">
            <div className="ql-track-bar-fill" style={{ width: `${Math.round((completedIds.length / STAGES.length) * 100)}%` }} />
          </div>
          <button className="ql-track-switch secondary" onClick={() => navigate("/topics")} aria-label="Switch topic or explore curriculum">
            Switch Topic ▾
          </button>
        </div>

        {/* ── Mode Switcher ─────────────────────────────────────────────────── */}
        <div className="ql-mode-switcher" role="tablist" aria-label="Homepage display mode">
          <button
            className={`ql-mode-tab ${mode === "story" ? "ql-mode-tab--active" : ""}`}
            role="tab"
            aria-selected={mode === "story"}
            onClick={() => setMode("story")}
          >
            📖 Story Mission
          </button>
          <button
            className={`ql-mode-tab ${mode === "persona" ? "ql-mode-tab--active" : ""}`}
            role="tab"
            aria-selected={mode === "persona"}
            onClick={() => setMode("persona")}
          >
            🎭 Choose Persona
          </button>
        </div>

        {/* Active selection summary pills */}
        <div className="ql-selection-pills">
          <span className="ql-sel-pill ql-sel-pill--theme">
            {activeTheme.emoji} {activeTheme.name}
          </span>
          <span className="ql-sel-pill ql-sel-pill--persona">
            {activePersona.emoji} {activePersona.name}
          </span>
          <button className="ql-sel-start primary" onClick={handleStartQuest}>
            ⚡ Start Quest
          </button>
        </div>

        {/* ══ Story Mission Mode ══════════════════════════════════════════════ */}
        {mode === "story" && (
          <motion.div
            className="ql-story-grid"
            role="tabpanel"
            aria-label="Story mission selection"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {THEMES.map((theme) => {
              const meta = THEME_META[theme.id];
              const isActive = selectedTheme === theme.id;
              return (
                <motion.button
                  key={theme.id}
                  className={`ql-story-card ${isActive ? "ql-story-card--active" : ""}`}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  style={isActive ? { borderColor: theme.accent, boxShadow: `0 0 20px ${theme.accentDim}` } : {}}
                  onClick={() => handleThemeSelect(theme.id)}
                  aria-pressed={isActive}
                  aria-label={`${theme.name} story theme`}
                >
                  {isActive && <span className="ql-story-card-active-badge" aria-label="Currently selected">✓ Selected</span>}
                  <div className="ql-story-card-top">
                    <span className="ql-story-card-icon" style={{ color: theme.accent }} aria-hidden="true">{theme.emoji}</span>
                    <span className="ql-story-card-tag">{meta.tag}</span>
                  </div>
                  <h3 className="ql-story-card-title" style={{ color: isActive ? theme.accent : undefined }}>{theme.name}</h3>
                  <p className="ql-story-card-desc">{meta.quote.replaceAll('"', "")}</p>
                  {expandedStory === theme.id && (
                    <p className="ql-story-card-details">{theme.story}</p>
                  )}
                  <span
                    className="ql-card-toggle"
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedStory(expandedStory === theme.id ? null : theme.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        setExpandedStory(expandedStory === theme.id ? null : theme.id);
                      }
                    }}
                  >
                    {expandedStory === theme.id ? "Hide details" : "More details"}
                  </span>
                  <div className="ql-story-card-footer">
                    <span className="ql-story-card-diff">{meta.difficulty}</span>
                    <span className="ql-story-card-bonus" style={{ color: theme.accent }}>{meta.bonus} XP Bonus</span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ══ Persona Mode ════════════════════════════════════════════════════ */}
        {mode === "persona" && (
          <motion.div
            className="ql-persona-grid"
            role="tabpanel"
            aria-label="Persona selection"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          >
            {PERSONAS.map((persona) => {
              const meta = PERSONA_META[persona.id];
              const isActive = selectedPersona === persona.id;
              return (
                <motion.button
                  key={persona.id}
                  className={`ql-persona-card ${isActive ? "ql-persona-card--active" : ""}`}
                  variants={{ hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1 } }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  style={isActive ? { borderColor: persona.accent, boxShadow: `0 0 18px ${persona.accentDim}` } : {}}
                  onClick={() => handlePersonaSelect(persona.id)}
                  aria-pressed={isActive}
                  aria-label={`${persona.name} persona`}
                >
                  {isActive && <span className="ql-persona-card-active-badge" aria-label="Currently selected">✓</span>}
                  <div className="ql-persona-card-avatar" style={{ background: `${persona.accentDim}`, borderColor: isActive ? persona.accent : "transparent" }} aria-hidden="true">
                    {persona.emoji}
                  </div>
                  <h3 className="ql-persona-card-name" style={{ color: isActive ? persona.accent : undefined }}>{persona.name}</h3>
                  <p className="ql-persona-card-quote">{persona.description}</p>
                  {expandedPersona === persona.id && (
                    <div className="ql-persona-card-details">
                      <span>{meta.archetype}</span>
                      <span>{meta.perk}</span>
                    </div>
                  )}
                  <span
                    className="ql-card-toggle"
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedPersona(expandedPersona === persona.id ? null : persona.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        setExpandedPersona(expandedPersona === persona.id ? null : persona.id);
                      }
                    }}
                  >
                    {expandedPersona === persona.id ? "Hide details" : "More details"}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ── Quest Map ─────────────────────────────────────────────────────── */}
        <div className="ql-quest-map" aria-label="Quest milestones">
          <div className="ql-quest-map-header">
            <h2 className="ql-quest-map-title">🗺️ Quest Milestones</h2>
            <div className="ql-quest-map-legend" aria-label="Legend">
              <span className="ql-legend-item ql-legend-item--done">✓ Cleared</span>
              <span className="ql-legend-item ql-legend-item--current">▶ Current</span>
              <span className="ql-legend-item ql-legend-item--locked">🔒 Locked</span>
            </div>
          </div>

          <div className="ql-quest-path">
            {STAGES.map((stage, idx) => {
              const unlocked = isStageUnlocked(stage);
              const completed = isStageCompleted(stage);
              const isCurrent = stage.id === currentStageId && !completed;
              const meta = STAGE_META[idx];

              let stateClass = "";
              if (completed) stateClass = "ql-stage-node--completed";
              else if (isCurrent) stateClass = "ql-stage-node--current";
              else if (!unlocked) stateClass = "ql-stage-node--locked";

              return (
                <div key={stage.id} className="ql-stage-row">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div
                      className={`ql-stage-connector ${completed || (idx <= (currentStageIndex >= 0 ? currentStageIndex : 0)) ? "ql-stage-connector--active" : ""}`}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    className={`ql-stage-node ${stateClass}`}
                    style={
                      completed ? { borderColor: stage.color, background: `${stage.color}22` } :
                      isCurrent ? { borderColor: stage.color, background: `${stage.dimColor}` } :
                      {}
                    }
                    onClick={() => handleStageClick(idx)}
                    aria-label={`Stage ${idx + 1}: ${stage.name}. ${completed ? "Completed." : isCurrent ? "Current stage." : unlocked ? "Unlocked." : "Locked."}`}
                  >
                    <div className="ql-stage-node-left">
                      <div className="ql-stage-node-dot" style={completed || isCurrent ? { background: stage.color } : {}}>
                        <span className={`ql-stage-bot ${completed ? "ql-stage-bot--happy" : "ql-stage-bot--sad"}`} aria-hidden="true">
                          {completed ? "🤖🎉" : unlocked ? "🤖😢" : "🤖💤"}
                        </span>
                      </div>
                      <div className="ql-stage-node-info">
                        <span className="ql-stage-node-num">Stage {idx + 1}</span>
                        <span className="ql-stage-node-name" style={unlocked ? { color: stage.color } : {}}>
                          {stage.name}
                          {stage.bossBonus && <span className="ql-stage-boss-badge" aria-label="Boss level">💀 BOSS</span>}
                        </span>
                        <span className="ql-stage-node-desc">{meta.desc.split(" — ")[0]}</span>
                      </div>
                    </div>
                    <div className="ql-stage-node-right">
                      <span className="ql-stage-xp-pill" style={{ color: stage.color, borderColor: `${stage.color}55` }}>
                        +{meta.xp} XP
                      </span>
                      <span className={`ql-stage-action ${completed ? "ql-stage-action--done" : isCurrent ? "ql-stage-action--play" : !unlocked ? "ql-stage-action--locked" : ""}`}>
                        {completed ? "✓ Review" : isCurrent ? "▶ Play" : !unlocked ? "🔒 Locked" : "▶ Start"}
                      </span>
                    </div>
                  </button>
                  <button
                    className="ql-stage-details-toggle"
                    onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
                    aria-expanded={expandedStage === stage.id}
                  >
                    {expandedStage === stage.id ? "Hide details ↑" : "Details ↓"}
                  </button>
                  {expandedStage === stage.id && (
                    <div className="ql-stage-details">
                      <span>{meta.desc}</span>
                      <span>{meta.questions} questions · ~{meta.minutes} min</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ql-quest-map-footer">
            <button className="secondary ql-quest-full-map" onClick={() => navigate("/stages")}>
              🗺️ Open Full Stage Map →
            </button>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════ RIGHT COLUMN — SIDEBAR ════════════════ */}
      <aside className="ql-sidebar" aria-label="Profile and navigation">

        {/* ── User Profile Card ─────────────────────────────────────────────── */}
        <div className="ql-profile-card">
          {user ? (
            <>
              <div className="ql-profile-top">
                <div className="ql-profile-avatar-wrap">
                  <div className="ql-profile-avatar" aria-label="User avatar">
                    {user.avatar || "🧑‍💻"}
                  </div>
                  <span className="ql-online-dot" title="Online" aria-label="Online" />
                </div>
                <div className="ql-profile-info">
                  <p className="ql-profile-name">{user.name}</p>
                  <p className="ql-profile-username">{user.gamerTag || `@${user.username || "player"}`}</p>
                </div>
              </div>
              <div className="ql-profile-rank-row">
                <span className="ql-profile-stage-badge">
                  {STAGES.find((s) => s.id === currentStageId)?.emoji ?? "🌱"}{" "}
                  Lv.{playerLevel} · {user.title || "Adventurer"}
                </span>
                <span className="ql-profile-league-badge">Quest League A</span>
              </div>
              {/* XP bar */}
              <div className="ql-profile-xp-row">
                <span className="ql-profile-xp-label">XP</span>
                <div
                  className="ql-profile-xp-bar"
                  role="progressbar"
                  aria-valuenow={xpPct}
                  aria-valuemax={100}
                  aria-label={`${totalXp % 100} of 100 XP to next level`}
                >
                  <div
                    className="ql-profile-xp-fill"
                    style={{
                      width: `${xpPct}%`,
                    }}
                  />
                </div>
                <span className="ql-profile-xp-val">{totalXp % 100}/100</span>
              </div>
              <div className="ql-profile-coins">
                🪙 {totalCoins.toLocaleString()} coins
              </div>

            </>
          ) : (
            <div className="ql-profile-guest-card">
              <div className="ql-profile-top">
                <div className="ql-profile-avatar-wrap">
                  <div className="ql-profile-avatar" aria-label="Guest avatar">🧑‍💻</div>
                </div>
                <div className="ql-profile-info">
                  <p className="ql-profile-name">Guest Explorer</p>
                  <p className="ql-profile-username">@guest</p>
                </div>
              </div>
              <p className="ql-profile-guest-hint">Sign in to track your XP, streak, and rank!</p>
              <div className="ql-profile-guest-actions">
                <button className="primary ql-profile-signin-btn" onClick={() => navigate("/login")}>
                  🔑 Sign In
                </button>
                <button className="secondary ql-profile-users-btn" onClick={() => navigate("/profile")}>
                  👥 View 5 Accounts
                </button>
              </div>
            </div>
          )}
        </div>

                {/* ── Player Achievements ────────────────────────────────────────────── */}
        <div className="ql-achievements-panel">
          <h3 className="ql-achievements-title">🏆 Player Achievements</h3>
          <div className="ql-achievements-grid">
            <div className="ql-achievement-card">
              <span className="ql-ach-label">League Rank</span>
              <span className="ql-ach-value" style={{ color: "#f59e0b" }}>
                {playerRank ? `#${playerRank}` : "Unranked"}
              </span>
            </div>
            <div className="ql-achievement-card">
              <span className="ql-ach-label">Saved Mistakes</span>
              <span className="ql-ach-value" style={{ color: "#fbbf24" }}>
                {mistakeCount}
              </span>
            </div>
            <div className="ql-achievement-card">
              <span className="ql-ach-label">Daily Challenge</span>
              <span className="ql-ach-value" style={{ color: dcDoneToday ? "#10b981" : "#f59e0b" }}>
                {dcDoneToday ? "Done" : "Pending"}
              </span>
            </div>
            <div className="ql-achievement-card">
              <span className="ql-ach-label">Active Streak</span>
              <span className="ql-ach-value" style={{ color: "#ef4444" }}>
                {currentStreakCount}d
              </span>
            </div>
          </div>
        </div>

        {/* ── Daily Target Widget ───────────────────────────────────────────── */}
        <div className="ql-daily-target">
          <div className="ql-daily-target-header">
            <span className="ql-daily-target-title">🎯 Daily Target</span>
            <span className="ql-daily-target-count">{todayCount}/{dailyGoal} Quests</span>
          </div>
          <div
            className="ql-daily-target-bar"
            role="progressbar"
            aria-valuenow={todayCount}
            aria-valuemax={dailyGoal}
            aria-label={`${todayCount} of ${dailyGoal} quests completed today`}
          >
            <div
              className={`ql-daily-target-fill ${dailyPct >= 100 ? "ql-daily-target-fill--done" : ""}`}
              style={{ width: `${dailyPct}%` }}
            />
          </div>
          <p className="ql-daily-motivation">{dailyMotivation}</p>
        </div>

        {/* ── Slash 'n Learn Widget ───────────────────────────────────────────── */}
        <div className="ql-slash-widget" onClick={() => navigate("/fruit-ninja")}>
          <div className="ql-slash-widget-content">
            <h3 className="ql-slash-title">🥷 Slash 'n Learn</h3>
            <p className="ql-slash-desc">Play the quick-fire slicing quiz to earn XP and Bob Coins!</p>
          </div>
          <button className="primary ql-slash-btn">Play Now</button>
        </div>

        {/* ── Streak at-risk banner ─────────────────────────────────────────── */}
        {isAtRisk && (
          <div className="ql-streak-risk-banner" role="alert">
            <span>⚠️ Streak at risk!</span>
            <button className="primary" onClick={() => navigate("/streak")}>
              🛡️ Save It
            </button>
          </div>
        )}

        </aside>

      {/* ══ Stage detail modal ═════════════════════════════════════════════════ */}
      {activeStageModal !== null && (
        <StageModal
          stage={STAGES[activeStageModal]}
          meta={STAGE_META[activeStageModal]}
          stageIndex={activeStageModal}
          isUnlocked={isStageUnlocked(STAGES[activeStageModal])}
          isCompleted={isStageCompleted(STAGES[activeStageModal])}
          selectedPersona={selectedPersona}
          onClose={() => setActiveStageModal(null)}
          onStart={() => handleStartStage(STAGES[activeStageModal])}
        />
      )}

      {/* ══ Logout confirmation modal ══════════════════════════════════════════ */}
      {showLogout && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </PageTransition>
  );
}

export default HomePage;
