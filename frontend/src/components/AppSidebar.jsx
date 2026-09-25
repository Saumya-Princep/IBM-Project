import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppSidebar.css";

const SIDEBAR_LINKS = [
  { label: "Home",            path: "/",                emoji: "🏠" },
  { label: "Daily Challenge", path: "/daily-challenge", emoji: "🌟" },
  { label: "Topics & Quizzes",path: "/topics",           emoji: "📚" },
  { label: "Stage Map",       path: "/stages",           emoji: "🗺️" },
  { label: "Leaderboard",     path: "/leaderboard",      emoji: "🏆" },
  { label: "Streaks",         path: "/streak",           emoji: "🔥" },
  { label: "Mistake Museum",  path: "/museum",           emoji: "🏛️" },
  { label: "Dashboard",       path: "/dashboard",        emoji: "📊" },
  { label: "Slash 'n Learn",     path: "/fruit-ninja",      emoji: "🥷" },
];

function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="ql-modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm sign out" onClick={onCancel}>
      <div className="ql-modal-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="ql-modal-title">Sign Out?</h3>
        <p className="ql-modal-body">Your progress is saved locally. You can return any time.</p>
        <div className="ql-modal-actions">
          <button className="ql-modal-confirm" onClick={onConfirm}>Yes, Sign Out</button>
          <button className="ql-modal-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/stages" && (location.pathname.startsWith("/stages") || location.search.includes("stageId="))) {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogoutConfirm = async () => {
    setShowLogout(false);
    await logout();
    navigate("/");
  };

  return (
    <>
      <aside className={`app-sidebar ${collapsed ? "app-sidebar--collapsed" : ""}`} aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <span className="sidebar-title">{collapsed ? "⚔️" : "NAVIGATION"}</span>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "❯" : "❮"}
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-list">
            {SIDEBAR_LINKS.map(({ label, path, emoji }) => {
              const active = isActive(path);
              return (
                <li key={path}>
                  <button
                    className={`sidebar-link ${active ? "sidebar-link--active" : ""}`}
                    onClick={() => navigate(path)}
                    title={collapsed ? label : undefined}
                  >
                    <span className="sidebar-link-emoji" aria-hidden="true">{emoji}</span>
                    {!collapsed && <span className="sidebar-link-label">{label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <button
              className="sidebar-logout-btn"
              onClick={() => setShowLogout(true)}
              title={collapsed ? "Sign Out" : undefined}
            >
              <span className="sidebar-link-label">{collapsed ? "🚪" : "Sign Out"}</span>
            </button>
          ) : (
            <button
              className="sidebar-logout-btn"
              onClick={() => navigate("/login")}
              title={collapsed ? "Sign In" : undefined}
              style={{ color: "var(--text-main)", borderColor: "var(--border-subtle)" }}
            >
              <span className="sidebar-link-label">{collapsed ? "🔑" : "Sign In"}</span>
            </button>
          )}
          {!collapsed && (
            <div className="sidebar-footer-info">
              <span className="sidebar-footer-tag">QuestLearn v1.0</span>
              <span className="sidebar-footer-desc">Gamified Learning Platform</span>
            </div>
          )}
        </div>
      </aside>

      {showLogout && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}

export default AppSidebar;
