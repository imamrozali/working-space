import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { sound } from './utils/sound';
import { IconDesktop, IconWebClient, IconServiceHub, IconStorageCDN, IconAlert } from './components/Icons';
import { AmbientBackground } from './components/AmbientBackground';
import { ENV } from './config/env';
import type { StorageStatsPayload } from './types/websocket';
import './App.css';

function App() {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '', '', '']);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'pairing' | 'console' | 'service' | 'storage'>('pairing');
  const [activeTile, setActiveTile] = useState<'client' | 'desktop' | 'service' | 'storage'>('client');
  const [soundActive, setSoundActive] = useState<boolean>(sound.isEnabled());
  const [storageTestFilename, setStorageTestFilename] = useState<string>('');
  const [storageChecking, setStorageChecking] = useState<boolean>(false);
  const [storageHealth, setStorageHealth] = useState<{ status: string; cdnFolder?: string; service?: string; storage?: StorageStatsPayload } | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [showBoot, setShowBoot] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('omni_boot_dismissed') !== 'true';
  });
  const [bootPlaying, setBootPlaying] = useState<boolean>(false);

  const tabsRef = useRef<HTMLElement>(null);
  const [gliderStyle, setGliderStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const {
    serverUrl,
    changeServerUrl,
    status,
    pairedSession,
    pairError,
    secureMessages,
    submitPair,
    sendSecureMessage,
    reconnect,
    serverStorage,
    requestServerStorage
  } = useWebSocket();

  // PS5 Authentic Boot Sequence with Dark Animated Atmosphere
  useEffect(() => {
    if (!showBoot) return;

    const bootTimer = setTimeout(() => {
      setBootPlaying(true);
      sound.playStartup();
    }, 100);

    // Otomatis transisi ke console hub setelah intro selesai
    const autoDismissTimer = setTimeout(() => {
      dismissBoot();
    }, 2600);

    const onKeySkip = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      dismissBoot();
    };
    window.addEventListener('keydown', onKeySkip);

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(autoDismissTimer);
      window.removeEventListener('keydown', onKeySkip);
    };
  }, [showBoot]);

  function dismissBoot() {
    try {
      sessionStorage.setItem('omni_boot_dismissed', 'true');
    } catch {}
    setBootPlaying(false);
    setTimeout(() => {
      setShowBoot(false);
    }, 850);
  }

  function handleReplayBoot() {
    setShowBoot(true);
    setBootPlaying(false);
    setTimeout(() => {
      setBootPlaying(true);
      sound.playStartup();
    }, 100);
  }

  const part1 = pinDigits.slice(0, 4).join('');
  const part2 = pinDigits.slice(4, 8).join('');
  const filledCount = pinDigits.filter((d) => d.length === 1).length;
  const isPinComplete = filledCount === 8;
  const fullPairCode = isPinComplete ? `PAIR-${part1}-${part2}` : '';
  const ccode = isPinComplete ? part2 : '';

  function populateDigitsFromRaw(raw: string) {
    let clean = raw.toUpperCase().replace(/\s+/g, '');
    if (clean.startsWith('PAIR-')) {
      clean = clean.slice(5);
    } else if (clean.startsWith('PAIR')) {
      clean = clean.slice(4);
    }
    clean = clean.replace(/[^A-Z0-9]/g, '');

    const nextDigits = ['', '', '', '', '', '', '', ''];
    for (let i = 0; i < 8 && i < clean.length; i++) {
      if (i < 4) {
        nextDigits[i] = clean[i];
      } else if (/[0-9]/.test(clean[i])) {
        nextDigits[i] = clean[i];
      }
    }
    setPinDigits(nextDigits);
    sound.playEnter();

    const firstEmpty = nextDigits.findIndex((d) => d === '');
    const targetIdx = firstEmpty === -1 ? 7 : firstEmpty;
    setTimeout(() => {
      pinInputRefs.current[targetIdx]?.focus();
    }, 50);
  }

  function handleDigitChange(idx: number, rawVal: string) {
    const val = rawVal.toUpperCase();
    if (!val) {
      const next = [...pinDigits];
      next[idx] = '';
      setPinDigits(next);
      return;
    }

    const char = val.slice(-1);
    if (idx < 4) {
      if (!/[A-Z0-9]/.test(char)) return;
    } else {
      if (!/[0-9]/.test(char)) return;
    }

    sound.playNav();
    const next = [...pinDigits];
    next[idx] = char;
    setPinDigits(next);

    if (idx < 7) {
      pinInputRefs.current[idx + 1]?.focus();
    }
  }

  function handleDigitKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (pinDigits[idx]) {
        const next = [...pinDigits];
        next[idx] = '';
        setPinDigits(next);
      } else if (idx > 0) {
        const next = [...pinDigits];
        next[idx - 1] = '';
        setPinDigits(next);
        pinInputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      pinInputRefs.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < 7) {
      e.preventDefault();
      pinInputRefs.current[idx + 1]?.focus();
    } else if (e.key === 'Enter') {
      if (isPinComplete) {
        e.preventDefault();
        handlePairSubmit(e);
      }
    }
  }

  function handleDigitPaste(_idx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      populateDigitsFromRaw(pasted);
    }
  }

  async function handlePasteCode() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        sound.playCopy();
        populateDigitsFromRaw(text);
      }
    } catch {
      // Clipboard read permission denied or unavailable
    }
  }

  function handleClearPin() {
    sound.playBack();
    setPinDigits(['', '', '', '', '', '', '', '']);
    pinInputRefs.current[0]?.focus();
  }

  // Dynamic glider sliding indicator measurement
  useEffect(() => {
    const updateGlider = () => {
      if (!tabsRef.current) return;
      const activeEl = tabsRef.current.querySelector<HTMLElement>('.ps5-hub-tab.active');
      if (activeEl) {
        const navRect = tabsRef.current.getBoundingClientRect();
        const tabRect = activeEl.getBoundingClientRect();
        const left = tabRect.left - navRect.left + tabsRef.current.scrollLeft;
        setGliderStyle({
          transform: `translateX(${Math.round(left)}px)`,
          width: `${Math.round(tabRect.width)}px`,
          opacity: 1,
        });
      }
    };

    const raf = requestAnimationFrame(updateGlider);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && tabsRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateGlider();
      });
      resizeObserver.observe(tabsRef.current);
      Array.from(tabsRef.current.children).forEach((child) => {
        if (child instanceof HTMLElement && child.classList.contains('ps5-hub-tab')) {
          resizeObserver?.observe(child);
        }
      });
    }

    const navEl = tabsRef.current;
    navEl?.addEventListener('scroll', updateGlider, { passive: true });
    window.addEventListener('resize', updateGlider, { passive: true });

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(updateGlider);
    }

    return () => {
      cancelAnimationFrame(raf);
      navEl?.removeEventListener('scroll', updateGlider);
      window.removeEventListener('resize', updateGlider);
      resizeObserver?.disconnect();
    };
  }, [activeTab, showBoot]);

  async function handleCheckStorageHealth() {
    sound.playEnter();
    setStorageChecking(true);
    setStorageError(null);
    const storageBase = ENV.DEFAULT_STORAGE_URL.replace(/\/+$/, '');
    try {
      const res = await fetch(`${storageBase}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStorageHealth(data);
    } catch {
      try {
        const fallbackUrl = storageBase.replace('localhost', '127.0.0.1');
        const fallbackRes = await fetch(`${fallbackUrl}/health`);
        if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status}`);
        const data = await fallbackRes.json();
        setStorageHealth(data);
      } catch (err: unknown) {
        setStorageHealth(null);
        setStorageError(err instanceof Error ? err.message : 'Web Storage service port 9000 tidak merespons.');
      }
    } finally {
      setStorageChecking(false);
    }
  }

  function handleTestAssetAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!storageTestFilename.trim()) return;
    sound.playEnter();
    const cleanName = storageTestFilename.trim();
    const storageBase = ENV.DEFAULT_STORAGE_URL.replace(/\/+$/, '');
    window.open(`${storageBase}/cdn/${encodeURIComponent(cleanName)}`, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    if (pairedSession) {
      sound.playEnter();
    }
  }, [pairedSession]);

  useEffect(() => {
    if (pairError) {
      sound.playBack();
    }
  }, [pairError]);

  function handlePairSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isPinComplete) return;
    sound.playEnter();
    submitPair(fullPairCode, ccode);
  }

  function handleServerChange(e: React.FormEvent) {
    e.preventDefault();
    if (customUrlInput.trim()) {
      sound.playEnter();
      changeServerUrl(customUrlInput.trim());
      setCustomUrlInput('');
    }
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sound.playEnter();
    sendSecureMessage(chatMessage);
    setChatMessage('');
  }

  function handleTabChange(tab: 'pairing' | 'console' | 'service' | 'storage') {
    if (activeTab !== tab) {
      sound.playHubTab();
      setActiveTab(tab);
      const mappedTile: 'client' | 'desktop' | 'service' | 'storage' =
        tab === 'pairing' ? 'client' : tab === 'console' ? 'desktop' : tab;
      setActiveTile(mappedTile);
    }
  }

  function handleTileSelect(tile: 'client' | 'desktop' | 'service' | 'storage') {
    if (activeTile === tile) {
      sound.playEnter();
    } else {
      sound.playNav();
      setActiveTile(tile);
      const mappedTab: 'pairing' | 'console' | 'service' | 'storage' =
        tile === 'client' ? 'pairing' : tile === 'desktop' ? 'console' : tile;
      setActiveTab(mappedTab);
    }
  }

  function handleToggleSound() {
    const nextState = sound.toggleSound();
    setSoundActive(nextState);
  }

  const getStatusColor = () => {
    switch (status) {
      case 'initialized':
        return '#10b981'; // emerald
      case 'connected':
        return '#38bdf8'; // cyan
      case 'connecting':
        return '#f59e0b'; // amber
      default:
        return '#ef4444'; // rose
    }
  };

  return (
    <div className="ps5-app-wrapper">
      {/* Authentic Console Startup Intro */}
      {showBoot && (
        <div
          className={`ps5-boot-screen ${bootPlaying ? 'is-playing' : ''}`}
          onClick={() => dismissBoot()}
          role="region"
          aria-label="Omni Intro"
        >
          <div className="ps5-boot-center">
            <span className="ps5-boot-badge">OMNI CONSOLE SYSTEM HUB</span>
            <h1 className="ps5-boot-title">/omni</h1>
            <div className="ps5-boot-subline">Initializing secure environment...</div>
          </div>
        </div>
      )}

      {/* Animated Console Background Waves & Particles */}
      <AmbientBackground />

      {/* Atmosphere & Vignette */}
      <div className="ps5-glow-beam" />
      <div className="ps5-vignette" />

      <main className="ps5-main-container">
        {/* Topbar Navigation */}
        <header className="ps5-topbar">
          <div className="ps5-brand-block">
            <span className="ps5-brand-title">OMNI</span>
            <span className="ps5-badge-pill">WEB</span>
          </div>

          <nav className="ps5-hub-tabs" ref={tabsRef} aria-label="Web Platform Navigation">
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === 'pairing' ? 'active' : ''}`}
              onClick={() => handleTabChange('pairing')}
            >
              Device Pairing
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === 'console' ? 'active' : ''}`}
              onClick={() => handleTabChange('console')}
            >
              Live Stream
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === 'service' ? 'active' : ''}`}
              onClick={() => handleTabChange('service')}
            >
              Web Service
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === 'storage' ? 'active' : ''}`}
              onClick={() => handleTabChange('storage')}
            >
              Web Storage
            </button>
            <div className="ps5-hub-tabs-glider" style={gliderStyle} aria-hidden="true" />
          </nav>

          <div className="ps5-system-bar">
            {/* Replay Boot Intro Button */}
            <button
              type="button"
              className="ps5-sys-btn-pill"
              onClick={handleReplayBoot}
              title="Replay PS5 Boot Intro"
            >
              Replay Intro
            </button>

            {/* Sound Toggle Button (Matching Reference) */}
            <button
              type="button"
              className="ps5-sound-toggle-btn"
              onClick={handleToggleSound}
              aria-label="Toggle Sound"
              title={`Sound: ${soundActive ? 'ON' : 'OFF'}`}
            >
              {soundActive ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            <div className="ps5-status-group">
              <div className="ps5-status-pill" title={`WebSocket Status: ${status}`}>
                <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
                <span className="status-label">{status.toUpperCase()}</span>
              </div>
              {status === 'disconnected' && (
                <button
                  type="button"
                  className="ps5-reconnect-btn"
                  onClick={() => {
                    sound.playBack();
                    reconnect();
                  }}
                  title="Hubungkan ulang ke Web Service"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Ecosystem Ribbon Tiles */}
        <section className="ps5-ribbon-section" aria-label="Ecosystem Services">
          <div className="ps5-tiles-track" role="toolbar" aria-label="Select platform view">
            <button
              type="button"
              className={`ps5-tile ${activeTile === 'client' ? 'active' : ''}`}
              onClick={() => handleTileSelect('client')}
              aria-pressed={activeTile === 'client'}
              aria-label="Web Client Remote Client"
            >
              <div className="tile-icon">
                <IconWebClient />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Web Client</span>
                <span className="tile-role">Remote Client</span>
              </div>
            </button>
            <button
              type="button"
              className={`ps5-tile ${activeTile === 'desktop' ? 'active' : ''}`}
              onClick={() => handleTileSelect('desktop')}
              aria-pressed={activeTile === 'desktop'}
              aria-label="Desktop Host Tauri v2"
            >
              <div className="tile-icon">
                <IconDesktop />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Desktop Host</span>
                <span className="tile-role">Tauri v2</span>
              </div>
            </button>
            <button
              type="button"
              className={`ps5-tile ${activeTile === 'service' ? 'active' : ''}`}
              onClick={() => handleTileSelect('service')}
              aria-pressed={activeTile === 'service'}
              aria-label="Web Service Port 8080"
            >
              <div className="tile-icon">
                <IconServiceHub />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Web Service</span>
                <span className="tile-role">Port 8080</span>
              </div>
            </button>
            <button
              type="button"
              className={`ps5-tile ${activeTile === 'storage' ? 'active' : ''}`}
              onClick={() => handleTileSelect('storage')}
              aria-pressed={activeTile === 'storage'}
              aria-label="Web Storage Port 9000"
            >
              <div className="tile-icon">
                <IconStorageCDN />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Web Storage</span>
                <span className="tile-role">Port 9000</span>
              </div>
            </button>
          </div>
        </section>

        {/* Tab Content: Device Pairing */}
        {activeTab === 'pairing' && (
          <section className="ps5-details-section" key="pairing">
            <div className="ps5-section-header">
              <div className="ps5-edition-badge">
                <span className="ps-gold-pill">AUTHENTICATION</span>
                <span className="ps-meta-text">Target Hub: {serverUrl}</span>
              </div>
              <h1 className="ps5-game-title">Connect to Desktop</h1>
              <p className="ps5-game-desc">
                Masukkan kode pairing yang ditampilkan pada layar Desktop Platform. Server memverifikasi kode, lalu meneruskan pesan hanya antara dua perangkat yang terpasang.
              </p>
            </div>

            {!pairedSession ? (
              <div className="ps5-pair-action-box">
                <form onSubmit={handlePairSubmit} className="ps5-pair-form">
                  <div className="ps5-otp-container">
                    <div className="otp-header-bar">
                      <div className="otp-status-indicator">
                        <span className="field-label-dot" />
                        <span className="otp-title">PIN OTP Pairing Desktop</span>
                        <span className={`otp-count-badge ${isPinComplete ? 'complete' : ''}`}>
                          {isPinComplete ? '8/8 DIGIT TERVERIFIKASI' : `${filledCount}/8 DIGIT`}
                        </span>
                      </div>
                      <div className="otp-quick-actions">
                        <button
                          type="button"
                          className="btn-otp-action"
                          onClick={handlePasteCode}
                          title="Tempel kode dari clipboard"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                          </svg>
                          <span>Paste Code</span>
                        </button>
                        {filledCount > 0 && (
                          <button
                            type="button"
                            className="btn-otp-action btn-otp-clear"
                            onClick={handleClearPin}
                            title="Hapus seluruh digit"
                          >
                            <span>Clear</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="ps5-otp-track" role="group" aria-label="Input PIN OTP Pairing">
                      {/* Fixed Prefix */}
                      <div className="otp-prefix-box" aria-hidden="true">
                        <span className="otp-prefix-text">PAIR</span>
                      </div>

                      <span className="otp-dash" aria-hidden="true">-</span>

                      {/* Part 1: 4 alphanumeric slots */}
                      <div className="otp-group" role="group" aria-label="Part 1 (4 Karakter Alfanumerik)">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            ref={(el) => { pinInputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="text"
                            maxLength={1}
                            className={`otp-digit-slot ${pinDigits[idx] ? 'is-filled' : ''}`}
                            value={pinDigits[idx]}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                            onPaste={(e) => handleDigitPaste(idx, e)}
                            onFocus={(e) => e.target.select()}
                            aria-label={`Digit ${idx + 1}`}
                            autoComplete="off"
                            spellCheck={false}
                          />
                        ))}
                      </div>

                      <span className="otp-dash" aria-hidden="true">-</span>

                      {/* Part 2: 4 numeric slots (Challenge Code) */}
                      <div className="otp-group" role="group" aria-label="Part 2 (4 Digit Challenge Code)">
                        {[4, 5, 6, 7].map((idx) => (
                          <input
                            key={idx}
                            ref={(el) => { pinInputRefs.current[idx] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            className={`otp-digit-slot otp-digit-numeric ${pinDigits[idx] ? 'is-filled' : ''}`}
                            value={pinDigits[idx]}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                            onPaste={(e) => handleDigitPaste(idx, e)}
                            onFocus={(e) => e.target.select()}
                            aria-label={`Digit ${idx + 1} (Challenge code)`}
                            autoComplete="off"
                            spellCheck={false}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="otp-legend-row">
                      <span className="legend-chip">
                        <span className="legend-dot dot-cyan" />
                        <span>Digit 1-4: Alfanumerik unik</span>
                      </span>
                      <span className="legend-chip">
                        <span className="legend-dot dot-gold" />
                        <span>Digit 5-8: Challenge Code (ccode) otomatis</span>
                      </span>
                    </div>
                  </div>

                  {pairError && (
                    <div className="ps5-error-alert" role="alert" aria-live="polite">
                      <span className="error-icon">
                        <IconAlert />
                      </span>
                      <span>{pairError}</span>
                    </div>
                  )}

                  <div className="ps5-actions-row">
                    <button
                      type="submit"
                      className="ps5-btn-primary"
                      disabled={!isPinComplete || (status !== 'initialized' && status !== 'connected')}
                    >
                      <span>Hubungkan ke Desktop</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                    <span className="ps5-helper-note">Batas 5x percobaan salah sebelum kode dibatalkan secara otomatis.</span>
                  </div>
                </form>
              </div>
            ) : (
              <div className="ps5-paired-success-box">
                <div className="ps5-paired-alert">
                  <div className="alert-badge">PAIRED OK</div>
                  <div className="alert-body">
                    <strong>Terhubung secara Aman dengan {pairedSession.peerClient.name}</strong>
                    <div className="alert-sub">Session ID: <code>{pairedSession.pairSessionId}</code></div>
                  </div>
                </div>

                <div className="ps5-chat-card">
                  <div className="card-subtitle">Paired Direct Channel</div>
                  <div className="ps5-stream-box">
                    {secureMessages.length === 0 ? (
                      <div className="stream-empty">Belum ada pesan. Kirim pesan ke Desktop Platform melalui formulir di bawah.</div>
                    ) : (
                      secureMessages.map((msg, idx) => (
                        <div key={idx} className="stream-line">
                          <span className="sender-tag">[{msg.sender}]</span>
                          <span className="time-tag">{msg.time}:</span>
                          <span className="msg-payload">{msg.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="ps5-capsule-form" onSubmit={handleSendChat}>
                    <span className="capsule-prefix">&gt;</span>
                    <input
                      type="text"
                      className="capsule-input"
                      placeholder="Kirim pesan ke Desktop..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <button type="submit" className="capsule-submit-btn" disabled={!chatMessage.trim()}>
                      <span>Kirim ke Desktop</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab Content: Live Stream */}
        {activeTab === 'console' && (
          <section className="ps5-details-section" key="console">
            <div className="ps5-section-header">
              <div className="ps5-edition-badge">
                <span className="ps-gold-pill">LOG STREAM</span>
                <span className="ps-meta-text">Target: {serverUrl}</span>
              </div>
              <h1 className="ps5-game-title">WebSocket Traffic</h1>
              <p className="ps5-game-desc">
                Monitoring komunikasi real-time antara Web Platform browser dan Web Service backend.
              </p>
            </div>

            <div className="subpage-step-code-card">
              <pre className="stream-pre">
                {secureMessages.length === 0 ? (
                  <code>[system] Menunggu transmisi data pada socket {serverUrl}...</code>
                ) : (
                  secureMessages.map((msg, idx) => (
                    <code key={idx} className="code-line">
                      <span className="code-time">{msg.time}</span> <span className="code-sender">{msg.sender}</span>: {msg.text}
                    </code>
                  ))
                )}
              </pre>
            </div>
          </section>
        )}

        {/* Tab Content: Web Service Hub */}
        {activeTab === 'service' && (
          <section className="ps5-details-section" key="service">
            <div className="ps5-section-header">
              <div className="ps5-edition-badge">
                <span className="ps-gold-pill">NETWORK DOMAIN</span>
                <span className="ps-meta-text">Endpoint Configuration &bull; Port 8080</span>
              </div>
              <h1 className="ps5-game-title">Target Server Address</h1>
              <p className="ps5-game-desc">
                Pilih atau masukkan domain WebSocket web-service yang ingin dihubungkan.
              </p>
            </div>

            <div className="ps5-config-box">
              <div className="ps5-presets-row">
                <button
                  type="button"
                  className={`ps5-preset-btn ${serverUrl === 'ws://localhost:8080' ? 'active' : ''}`}
                  onClick={() => {
                    sound.playEnter();
                    changeServerUrl('ws://localhost:8080');
                  }}
                >
                  Localhost (ws://localhost:8080)
                </button>
                <button
                  type="button"
                  className={`ps5-preset-btn ${serverUrl === 'ws://127.0.0.1:8080' ? 'active' : ''}`}
                  onClick={() => {
                    sound.playEnter();
                    changeServerUrl('ws://127.0.0.1:8080');
                  }}
                >
                  127.0.0.1:8080
                </button>
              </div>

              <form className="ps5-capsule-form" onSubmit={handleServerChange}>
                <span className="capsule-prefix">ws://</span>
                <input
                  type="text"
                  className="capsule-input"
                  placeholder="Custom domain / IP (misal: 192.168.1.50:8080 atau wss://...)"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  spellCheck={false}
                />
                <button type="submit" className="capsule-submit-btn" disabled={!customUrlInput.trim()}>
                  <span>Set Target URL</span>
                </button>
              </form>

              {/* Web Service Storage Metrics Card */}
              <div className="storage-status-card" style={{ marginTop: '20px' }}>
                <div className="storage-card-header">
                  <span className="card-tag">WEB-SERVICE SERVER STORAGE (PORT 8080)</span>
                  <button
                    type="button"
                    className="btn-storage-refresh"
                    onClick={() => {
                      sound.playEnter();
                      requestServerStorage();
                    }}
                    title="Minta info storage terbaru via WebSocket"
                  >
                    <span>Refresh Service</span>
                  </button>
                </div>
                {serverStorage ? (
                  <div className="storage-meter-body">
                    <div className="storage-metric-row">
                      <div className="metric-col">
                        <span className="metric-label">Total Disk:</span>
                        <span className="metric-val">{serverStorage.totalFormatted}</span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-label">Terpakai:</span>
                        <span className="metric-val text-used">{serverStorage.usedFormatted}</span>
                      </div>
                      <div className="metric-col">
                        <span className="metric-label">Tersedia (Free):</span>
                        <span className="metric-val text-free">{serverStorage.freeFormatted}</span>
                      </div>
                    </div>

                    <div className="ps5-meter-track" title={`${serverStorage.usedPercentage}% terpakai`}>
                      <div
                        className="ps5-meter-fill fill-cyan"
                        style={{ width: `${Math.min(100, serverStorage.usedPercentage)}%` }}
                      />
                    </div>
                    <div className="meter-footer-info">
                      <span>Path: <code>{serverStorage.path}</code></span>
                      <span className="meter-percent">{serverStorage.usedPercentage}% terpakai</span>
                    </div>
                  </div>
                ) : (
                  <p className="diag-hint">
                    {status === 'initialized' || status === 'connected'
                      ? 'Menunggu transmisi metrik storage dari web-service...'
                      : 'Hubungkan WebSocket ke web-service untuk melihat kapasitas storage server.'}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab Content: Web Storage CDN */}
        {activeTab === 'storage' && (
          <section className="ps5-details-section" key="storage">
            <div className="ps5-section-header">
              <div className="ps5-edition-badge">
                <span className="ps-gold-pill">STORAGE CDN</span>
                <span className="ps-meta-text">Port 9000 &bull; Static File Vault</span>
              </div>
              <h1 className="ps5-game-title">Web Storage Service</h1>
              <p className="ps5-game-desc">
                Layanan pengiriman file statis lokal dan endpoint upload berkecepatan tinggi dengan proteksi path traversal dan sanitasi MIME.
              </p>
            </div>

            <div className="ps5-config-box">
              <div className="ps5-storage-grid">
                <div className="storage-status-card">
                  <div className="storage-card-header">
                    <span className="card-tag">CDN SERVICE SPEC</span>
                    <span className="storage-badge-online">PORT 9000</span>
                  </div>
                  <div className="storage-info-row">
                    <span className="storage-label">Base URL:</span>
                    <code className="storage-code">http://localhost:9000/cdn/:filename</code>
                  </div>
                  <div className="storage-info-row">
                    <span className="storage-label">Upload Endpoint:</span>
                    <code className="storage-code">POST /cdn/upload</code>
                  </div>
                  <div className="storage-info-row">
                    <span className="storage-label">Security:</span>
                    <span className="storage-sec-val">Path Traversal Containment &bull; API Key Protected</span>
                  </div>
                  <div className="storage-info-row">
                    <span className="storage-label">Storage Folder:</span>
                    <span className="storage-folder-val">cdn-global/</span>
                  </div>
                </div>

                <div className="storage-status-card">
                  <div className="storage-card-header">
                    <span className="card-tag">LIVE DIAGNOSTICS</span>
                    <button
                      type="button"
                      className="ps5-preset-btn"
                      onClick={handleCheckStorageHealth}
                      disabled={storageChecking}
                    >
                      {storageChecking ? 'Memeriksa...' : 'Check CDN Health'}
                    </button>
                  </div>
                  <div className="storage-diag-content">
                    {storageHealth ? (
                      <div className="diag-result">
                        <div className="diag-line">
                          <span className="diag-k">Status:</span>
                          <span className="diag-v-ok">{storageHealth.status.toUpperCase()}</span>
                        </div>
                        <div className="diag-line">
                          <span className="diag-k">Directory:</span>
                          <span className="diag-v">{storageHealth.cdnFolder || 'cdn-global'}</span>
                        </div>
                        <div className="diag-line">
                          <span className="diag-k">Service:</span>
                          <span className="diag-v">{storageHealth.service}</span>
                        </div>
                        {storageHealth.storage && (
                          <>
                            <div className="diag-line">
                              <span className="diag-k">Total / Free:</span>
                              <span className="diag-v">{storageHealth.storage.totalFormatted} ({storageHealth.storage.freeFormatted} free)</span>
                            </div>
                            <div className="diag-line">
                              <span className="diag-k">Terpakai:</span>
                              <span className="diag-v">{storageHealth.storage.usedFormatted} ({storageHealth.storage.usedPercentage}%)</span>
                            </div>
                          </>
                        )}
                      </div>
                    ) : storageError ? (
                      <div className="diag-error">
                        <span>Offline: {storageError}</span>
                      </div>
                    ) : (
                      <p className="diag-hint">
                        Klik tombol di atas untuk memverifikasi endpoint static CDN pada port 9000.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <form className="ps5-capsule-form" onSubmit={handleTestAssetAccess}>
                <span className="capsule-prefix">cdn/</span>
                <input
                  type="text"
                  className="capsule-input"
                  placeholder="Nama file untuk dicek (contoh: asset.png atau sample.txt)"
                  value={storageTestFilename}
                  onChange={(e) => setStorageTestFilename(e.target.value)}
                  spellCheck={false}
                />
                <button type="submit" className="capsule-submit-btn" disabled={!storageTestFilename.trim()}>
                  <span>Buka Asset</span>
                </button>
              </form>
            </div>
          </section>
        )}

        {/* PS5 Controller Shortcuts Bar */}
        <footer className="ps5-bottom-bar">
          <div className="bottom-shortcuts">
            <span className="shortcut-item">
              <kbd className="shortcut-key">Enter</kbd>
              <span>Confirm</span>
            </span>
            <span className="shortcut-item">
              <kbd className="shortcut-key">Tab</kbd>
              <span>Navigate</span>
            </span>
          </div>
          <span className="bottom-version">Omni Foundation Web Client v3.0</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
