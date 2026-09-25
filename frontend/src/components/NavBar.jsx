import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loadProfile, loadStreak } from "../data/progress.js";
import "./NavBar.css";
const SEARCH_ITEMS = [
  { label: "Daily Challenge", path: "/daily-challenge", category: "Activity", emoji: "🌟" },
  { label: "Topic-wise Quizzes", path: "/topics", category: "Learn", emoji: "📚" },
  { label: "JavaScript Types & Variables", path: "/topics", category: "Topic", emoji: "🔤" },
  { label: "Functions & Closures", path: "/topics", category: "Topic", emoji: "⚡" },
  { label: "Async & Promises", path: "/topics", category: "Topic", emoji: "⏳" },
  { label: "Algorithms & Complexity", path: "/topics", category: "Topic", emoji: "🧮" },
  { label: "Stage Map", path: "/stages", category: "Progress", emoji: "🗺️" },
  { label: "Quest League Leaderboard", path: "/leaderboard", category: "Social", emoji: "🏆" },
  { label: "Streaks & Recovery", path: "/streak", category: "Activity", emoji: "🔥" },
  { label: "Mistake Museum", path: "/museum", category: "Review", emoji: "🏛️" },
  { label: "Learner Dashboard", path: "/dashboard", category: "Stats", emoji: "📊" },
  { label: "Slash 'n Learn", path: "/fruit-ninja", category: "Game", emoji: "🥷" },
];

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, toggle2FA } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isXpHovered, setIsXpHovered] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchUserData = () => {
      setProfile(loadProfile());
      setStreak(loadStreak());
    };

    fetchUserData();

    // Listen for storage updates so counters sync dynamically
    window.addEventListener("storage", fetchUserData);
    return () => window.removeEventListener("storage", fetchUserData);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalCoins = profile?.totalCoins ?? 0;
  const totalXp = profile?.totalXp ?? 0;
  const currentStreak = streak?.currentStreak ?? 0;
  const playerLevel = Math.max(1, Math.floor(totalXp / 100) + 1);

  const filteredSearch = searchQuery.trim()
    ? SEARCH_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectSearchItem = (path) => {
    navigate(path);
    setSearchQuery("");
    setSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    navigate("/login");
  };

  return (
    <header className="global-navbar" role="banner">
      {/* Brand Logo */}
      <button
        className="navbar-brand"
        onClick={() => navigate("/")}
        aria-label="QuestLearn home"
      >
        <span className="navbar-brand-icon">⚔️</span>
        <span className="navbar-brand-name">QuestLearn</span>
      </button>

      {/* Global Search Bar */}
      <div className="navbar-search-container" ref={searchRef}>
        <div className="navbar-search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search topics, stages, or features..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && filteredSearch.length > 0 && (
          <div className="search-dropdown">
            <ul className="search-dropdown-list">
              {filteredSearch.map((item, index) => (
                <li key={index}>
                  <button
                    className="search-dropdown-item"
                    onClick={() => handleSelectSearchItem(item.path)}
                  >
                    <span className="search-item-emoji">{item.emoji}</span>
                    <div className="search-item-info">
                      <span className="search-item-label">{item.label}</span>
                      <span className="search-item-cat">{item.category}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Live Status Metrics & User Profile */}
      <div className="navbar-status-wrap">
        {/* Streak Counter Box */}
        <button
          className="navbar-stat-box navbar-stat-box--streak"
          onClick={() => navigate("/streak")}
          title="Daily streak. Click to view recovery & calendar."
        >
          <div className="stat-avatar stat-avatar--streak">🔥</div>
          <div className="stat-meta">
            <span className="stat-name">Streak</span>
            <span className="stat-val">{currentStreak} Day{currentStreak !== 1 ? "s" : ""}</span>
          </div>
        </button>

        {/* Coins Counter Box */}
        <button
          className="navbar-stat-box navbar-stat-box--coins"
          onClick={() => navigate("/dashboard")}
          title="Total Coins earned"
        >
          <div className="stat-avatar stat-avatar--coins">🪙</div>
          <div className="stat-meta">
            <span className="stat-name">Coins</span>
            <span className="stat-val">{totalCoins.toLocaleString()}</span>
          </div>
        </button>

        {/* XP Counter Box */}
        <div 
          className="navbar-stat-box-wrapper"
          onMouseEnter={() => setIsXpHovered(true)}
          onMouseLeave={() => setIsXpHovered(false)}
        >
          <button
            className="navbar-stat-box navbar-stat-box--xp"
            onClick={() => navigate("/dashboard")}
            title="Click to view Dashboard"
          >
            <div className="stat-avatar stat-avatar--xp">⚡</div>
            <div className="stat-meta">
              <span className="stat-name">Total XP</span>
              <span className="stat-val">{totalXp.toLocaleString()}</span>
            </div>
          </button>
          
          {isXpHovered && (
            <div className="xp-hover-tooltip">
              <div className="xp-tooltip-val">{(totalXp / 50).toFixed(2)} Bob Coins</div>
              <div className="xp-tooltip-eq">50 XP = 1 Bob Coin</div>
            </div>
          )}
        </div>

        {/* Auth Actions (Right Side) */}
        <div className="navbar-auth-section">
          {user ? (
            <div className="navbar-user-menu">
              <button
                className="navbar-user-chip"
                onClick={() => setProfileDropdownOpen((o) => !o)}
                aria-expanded={profileDropdownOpen}
                aria-label="User profile menu"
              >
                <span className="navbar-avatar">{user.avatar || "🥷"}</span>
                <span className="navbar-username">{user.gamerTag || user.name.split(" ")[0]}</span>
                <span className="navbar-xp-tag">Lv.{playerLevel} • {totalXp} XP</span>
              </button>

              {profileDropdownOpen && (
                <div className="navbar-dropdown-panel" role="menu">
                  <div className="dropdown-user-header">
                    <div className="dropdown-header-top">
                      <span className="dropdown-user-name">{user.name}</span>
                      <span className="dropdown-gamer-tag">{user.gamerTag || `@${user.name.replace(/\s+/g, "")}`}</span>
                    </div>
                    <span className="dropdown-user-email">{user.email}</span>
                    <div className="dropdown-badge-row">
                      <span className="dropdown-chip">🔥 {currentStreak} Day Streak</span>
                      <span className="dropdown-chip">🪙 {totalCoins} Coins</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate("/profile");
                    }}
                    role="menuitem"
                  >
                    <span className="dropdown-item-icon">👤</span>
                    <span>Player Profile &amp; Edit</span>
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={async () => {
                      await toggle2FA();
                    }}
                    role="menuitem"
                  >
                    <span className="dropdown-item-icon">🔐</span>
                    <span>{user.twoFactorEnabled ? "Disable 2FA Shield" : "Enable 2FA Shield"}</span>
                  </button>

                  <button
                    className="dropdown-item dropdown-item--logout"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <span className="dropdown-item-icon">🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar-guest-actions">
              <button
                className="navbar-profiles-btn"
                onClick={() => navigate("/profile")}
                title="View 5 Hero Profiles"
              >
                <span>👥 Heroes</span>
              </button>
              <button
                className="navbar-signin-btn"
                onClick={() => navigate("/login")}
              >
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavBar;