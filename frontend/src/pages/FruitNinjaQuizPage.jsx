import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadProfile, saveProfile } from "../data/progress.js";
import "./FruitNinjaQuizPage.css";

function FruitNinjaQuizPage() {
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerDuration, setTimerDuration] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [showSkull, setShowSkull] = useState(false);
  const [missed, setMissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [cutOption, setCutOption] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [showCombo, setShowCombo] = useState(false);

  useEffect(() => {
    const handleDown = () => setIsMouseDown(true);
    const handleUp = () => setIsMouseDown(false);
    window.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchstart', handleDown);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchstart', handleDown);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  const fetchNextQuestion = async (currentTimer = timerDuration) => {
    try {
      const res = await fetch(`/api/question?maxOptionLength=20&singleLine=true`);
      const data = await res.json();
      setQuestion(data);
      setQuestionKey(k => k + 1);
      setTimeLeft(currentTimer);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  useEffect(() => {
    if (gameOver || !question || showSkull || missed || showSuccess) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time expired, missed!
          setMissed(true);
          setTimeout(() => {
            setGameOver(true);
          }, 1500);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [question, gameOver, showSkull, missed]);

  const handleOptionClick = (opt) => {
    if (gameOver || showSkull || missed || showSuccess || cutOption) return;
    setCutOption(opt);
    
    // Check if correct
    const isCorrect = opt.id === question.correctOption || opt === question.correctOption;
    
    if (isCorrect) {
      // 1. Add XP to global profile
      const profile = loadProfile();
      profile.totalXp = (profile.totalXp || 0) + 1;
      saveProfile(profile);
      window.dispatchEvent(new Event("storage"));

      // 2. Combo System
      setConsecutiveCorrect(c => {
        const newC = c + 1;
        if (newC > 0 && newC % 3 === 0) {
          setShowCombo(true);
          setSpeedMultiplier(s => s * 1.1);
          setTimeout(() => setShowCombo(false), 2000);
        }
        return newC;
      });

      setShowSuccess(true);
      setScore((s) => s + 1);
      setTimeout(() => {
        if (questionNumber >= 10) {
          setShowSuccess(false);
          setCutOption(null);
          setGameOver(true);
        } else {
          setQuestionNumber((n) => n + 1);
          fetchNextQuestion();
          setShowSuccess(false);
          setCutOption(null);
        }
      }, 1000);
    } else {
      setConsecutiveCorrect(0);
      setSpeedMultiplier(1.0);
      setShowSkull(true);
      setTimeout(() => {
        setGameOver(true);
      }, 1500);
    }
  };

  const restartGame = () => {
    setGameOver(false);
    setShowSkull(false);
    setMissed(false);
    setShowSuccess(false);
    setCutOption(null);
    setScore(0);
    setQuestionNumber(1);
    setConsecutiveCorrect(0);
    setSpeedMultiplier(1.0);
    fetchNextQuestion();
  };

  if (!question) {
    return <div className="ninja-loading">Loading Dojo...</div>;
  }

  // Ensure we have exactly 4 options by padding or slicing if necessary
  const options = question.options ? question.options.slice(0, 4) : [];

  return (
    <div className="ninja-container">
      <div className="ninja-header">
        <div className="ninja-stats">Score: {score}</div>
        <div className="ninja-stats" style={{ color: '#f59e0b' }}>Q: {Math.min(questionNumber, 10)}/10</div>
        <div className="ninja-settings">
          <label>Time Limit: </label>
          <select 
            value={timerDuration} 
            onChange={(e) => {
              const newDur = Number(e.target.value);
              setTimerDuration(newDur);
              setTimeLeft(newDur);
              fetchNextQuestion(newDur);
            }}
            className="ninja-select"
          >
            <option value={10}>10s</option>
            <option value={20}>20s</option>
            <option value={30}>30s</option>
          </select>
        </div>
        <div className="ninja-timer" style={{ color: timeLeft <= 3 ? '#ff4b2b' : 'white' }}>
          {timeLeft}s
        </div>
      </div>
      
      <div className="ninja-question-panel">
        <h2>{question.question}</h2>
      </div>

      <div className="ninja-play-area">
        <AnimatePresence>
          {showCombo && (
            <motion.div
              style={{ position: 'absolute', top: '25%', left: '50%', x: '-50%', y: '-50%', background: '#ff4b2b', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontSize: '2rem', fontWeight: 'bold', zIndex: 150, textShadow: '0 2px 10px rgba(0,0,0,0.5)', border: '2px solid white' }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              x{consecutiveCorrect} Combo! Difficulty +10%
            </motion.div>
          )}

          {(showSkull || missed || showSuccess) && (
            <motion.div 
              className="ninja-feedback"
              style={{ x: "-50%", y: "-50%" }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: showSkull ? [0, -15, 15, -15, 15, 0] : 0 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.6 }}
            >
              {showSuccess ? "✅ +1!" : (missed ? "⏰ Missed!" : "💀")}
            </motion.div>
          )}
        </AnimatePresence>

        {!gameOver && options.map((opt, idx) => {
          const optText = opt.text || opt;
          const isPaused = showSkull || missed || showSuccess;
          const isCut = cutOption && (cutOption.id === opt.id || cutOption === opt);

          return (
            <div
              key={`${questionKey}-${idx}`}
              className="ninja-option-bounds"
              style={{ left: `${10 + idx * 22}%` }}
            >
              <motion.div
                className="ninja-option-wrapper"
                animate={(isPaused && !isCut) ? { scale: 0.8, opacity: 0.5 } : {
                  top: ["0%", "100%"],
                  x: [0, (idx % 2 === 0 ? 1 : -1) * (15 + Math.random() * 30)]
                }}
                transition={{
                  top: {
                    duration: (1.5 + Math.random() * 1.5) / speedMultiplier,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeIn"
                  },
                  x: {
                    duration: (2 + Math.random() * 2) / speedMultiplier,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut"
                  }
                }}
              >
              {!isCut ? (
                <motion.button
                  className={`ninja-option color-${idx % 3}`}
                  onClick={() => handleOptionClick(opt)}
                  onMouseEnter={() => { if (isMouseDown) handleOptionClick(opt); }}
                  disabled={isPaused}
                  whileHover={isPaused ? {} : { scale: 1.15 }}
                  whileTap={isPaused ? {} : { scale: 0.9 }}
                >
                  <div className="ninja-option-content">{optText}</div>
                </motion.button>
              ) : (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  {/* The main bubble popping */}
                  <motion.div
                    className={`ninja-option color-${idx % 3}`}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: [1, 0.8, 1.8], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.35, times: [0, 0.3, 1], ease: "easeOut" }}
                  >
                    <div className="ninja-option-content">{optText}</div>
                  </motion.div>

                  {/* Shockwave ring */}
                  <motion.div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: "6px solid rgba(255,255,255,0.8)"
                    }}
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />

                  {/* Particles */}
                  {[...Array(6)].map((_, i) => {
                    const angle = (i * 60) * (Math.PI / 180);
                    const distance = 100;
                    return (
                      <motion.div
                        key={i}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          width: "14px",
                          height: "14px",
                          backgroundColor: "#fff",
                          borderRadius: "50%",
                          x: "-50%",
                          y: "-50%",
                        }}
                        animate={{
                          x: ["-50%", `calc(-50% + ${Math.cos(angle) * distance}px)`],
                          y: ["-50%", `calc(-50% + ${Math.sin(angle) * distance}px)`],
                          opacity: [1, 0],
                          scale: [1, 0.2]
                        }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      />
                    );
                  })}
                </div>
              )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {gameOver && (
        <div className="ninja-game-over">
          <h2 style={{ color: score >= 10 ? '#38ef7d' : '#ff4b2b', textShadow: score >= 10 ? '0 4px 20px rgba(56, 239, 125, 0.6)' : '0 4px 20px rgba(255, 75, 43, 0.6)' }}>
            {score >= 10 ? "Victory!" : "Game Over"}
          </h2>
          <p>Final Score: {score} / 10</p>
          <button className="primary" onClick={restartGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default FruitNinjaQuizPage;
