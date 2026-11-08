import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useWebSocket } from "./hooks/useWebSocket";
import { sound } from "./utils/sound";
import { IconDesktop, IconServiceHub, IconStorageCDN, IconWebClient } from "./components/Icons";
import { AmbientBackground } from "./components/AmbientBackground";
import { ENV } from "./config/env";
import type { StorageStatsPayload } from "./types/websocket";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [secureInput, setSecureInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"pairing" | "console" | "service" | "storage">("pairing");
  const [activeTile, setActiveTile] = useState<"desktop" | "service" | "storage" | "client">("desktop");
  const [soundActive, setSoundActive] = useState<boolean>(sound.isEnabled());
  const [storageTestFilename, setStorageTestFilename] = useState<string>("");
  const [storageChecking, setStorageChecking] = useState<boolean>(false);
  const [storageHealth, setStorageHealth] = useState<{ status: string; cdnFolder?: string; service?: string; storage?: StorageStatsPayload } | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [hostStorage, setHostStorage] = useState<StorageStatsPayload | null>(null);
  const [hostStorageLoading, setHostStorageLoading] = useState<boolean>(false);
  const [showBoot, setShowBoot] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("omni_boot_dismissed") !== "true";
  });
  const [bootPlaying, setBootPlaying] = useState<boolean>(false);

  const tabsRef = useRef<HTMLElement>(null);
  const [gliderStyle, setGliderStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const {
    serverUrl,
    changeServerUrl,
    status,
    pairingInfo,
    pairedSession,
    secureMessages,
    sendSecureMessage,
    requestNewPairCode,
    reconnect,
    serverStorage,
    requestServerStorage
  } = useWebSocket();

  const fetchHostStorage = useCallback(async () => {
    setHostStorageLoading(true);
    try {
      const stats = await invoke<StorageStatsPayload>("get_storage_stats");
      setHostStorage(stats);
    } catch (err) {
      console.error("Failed to query Rust host storage:", err);
    } finally {
      setHostStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHostStorage();
  }, [fetchHostStorage]);

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
      if (e.key === "Tab") return;
      dismissBoot();
    };
    window.addEventListener("keydown", onKeySkip);

    return () => {
      clearTimeout(bootTimer);
      clearTimeout(autoDismissTimer);
      window.removeEventListener("keydown", onKeySkip);
    };
  }, [showBoot]);

  function dismissBoot() {
    try {
      sessionStorage.setItem("omni_boot_dismissed", "true");
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

  // Dynamic glider sliding indicator measurement
  useEffect(() => {
    const updateGlider = () => {
      if (!tabsRef.current) return;
      const activeEl = tabsRef.current.querySelector<HTMLElement>(".ps5-hub-tab.active");
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
    if (typeof ResizeObserver !== "undefined" && tabsRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateGlider();
      });
      resizeObserver.observe(tabsRef.current);
      Array.from(tabsRef.current.children).forEach((child) => {
        if (child instanceof HTMLElement && child.classList.contains("ps5-hub-tab")) {
          resizeObserver?.observe(child);
        }
      });
    }

    const navEl = tabsRef.current;
    navEl?.addEventListener("scroll", updateGlider, { passive: true });
    window.addEventListener("resize", updateGlider, { passive: true });

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(updateGlider);
    }

    return () => {
      cancelAnimationFrame(raf);
      navEl?.removeEventListener("scroll", updateGlider);
      window.removeEventListener("resize", updateGlider);
      resizeObserver?.disconnect();
    };
  }, [activeTab, showBoot]);

  async function handleCheckStorageHealth() {
    sound.playEnter();
    setStorageChecking(true);
    setStorageError(null);
    const storageBase = ENV.DEFAULT_STORAGE_URL.replace(/\/+$/, "");
    try {
      const res = await fetch(`${storageBase}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStorageHealth(data);
    } catch {
      try {
        const fallbackUrl = storageBase.replace("localhost", "127.0.0.1");
        const fallbackRes = await fetch(`${fallbackUrl}/health`);
        if (!fallbackRes.ok) throw new Error(`HTTP ${fallbackRes.status}`);
        const data = await fallbackRes.json();
        setStorageHealth(data);
      } catch (err: unknown) {
        setStorageHealth(null);
        setStorageError(err instanceof Error ? err.message : "Web Storage service port 9000 tidak merespons.");
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
    const storageBase = ENV.DEFAULT_STORAGE_URL.replace(/\/+$/, "");
    window.open(`${storageBase}/cdn/${encodeURIComponent(cleanName)}`, "_blank", "noopener,noreferrer");
  }

  // Play sound when pair state changes to success
  useEffect(() => {
    if (pairedSession) {
      sound.playEnter();
    }
  }, [pairedSession]);

  async function greet() {
    sound.playEnter();
    setGreetMsg(await invoke("greet", { name }));
  }

  function handleServerChange(e: React.FormEvent) {
    e.preventDefault();
    if (customUrlInput.trim()) {
      sound.playEnter();
      changeServerUrl(customUrlInput.trim());
      setCustomUrlInput("");
    }
  }

  function handleSendSecure(e: React.FormEvent) {
    e.preventDefault();
    if (!secureInput.trim()) return;
    sound.playEnter();
    sendSecureMessage(secureInput);
    setSecureInput("");
  }

  function handleCopyCode() {
    if (pairingInfo?.pairCode) {
      sound.playCopy();
      navigator.clipboard.writeText(pairingInfo.pairCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleTabChange(tab: "pairing" | "console" | "service" | "storage") {
    if (activeTab !== tab) {
      sound.playHubTab();
      setActiveTab(tab);
      const mappedTile: "desktop" | "service" | "storage" | "client" =
        tab === "pairing" ? "desktop" : tab === "console" ? "client" : tab;
      setActiveTile(mappedTile);
    }
  }

  function handleTileSelect(tile: "desktop" | "service" | "storage" | "client") {
    if (activeTile === tile) {
      sound.playEnter();
    } else {
      sound.playNav();
      setActiveTile(tile);
      const mappedTab: "pairing" | "console" | "service" | "storage" =
        tile === "desktop" ? "pairing" : tile === "client" ? "console" : tile;
      setActiveTab(mappedTab);
    }
  }

  function handleToggleSound() {
    const nextState = sound.toggleSound();
    setSoundActive(nextState);
  }

  const getStatusColor = () => {
    switch (status) {
      case "initialized":
        return "#10b981"; // emerald
      case "connected":
        return "#38bdf8"; // cyan
      case "connecting":
        return "#f59e0b"; // amber
      default:
        return "#ef4444"; // rose
    }
  };

  return (
    <div className="ps5-app-wrapper">
      {/* Authentic Console Startup Intro */}
      {showBoot && (
        <div
          className={`ps5-boot-screen ${bootPlaying ? "is-playing" : ""}`}
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

      {/* Background Atmosphere & Vignette */}
      <div className="ps5-glow-beam" />
      <div className="ps5-vignette" />

      <main className="ps5-main-container">
        {/* Topbar Navigation */}
        <header className="ps5-topbar">
          <div className="ps5-brand-block">
            <span className="ps5-brand-title">OMNI</span>
            <span className="ps5-badge-pill">DESKTOP</span>
          </div>

          <nav className="ps5-hub-tabs" ref={tabsRef} aria-label="Omni Navigation">
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "pairing" ? "active" : ""}`}
              onClick={() => handleTabChange("pairing")}
            >
              Device Pairing
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "console" ? "active" : ""}`}
              onClick={() => handleTabChange("console")}
            >
              Live Stream
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "service" ? "active" : ""}`}
              onClick={() => handleTabChange("service")}
            >
              Web Service
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "storage" ? "active" : ""}`}
              onClick={() => handleTabChange("storage")}
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
              title={`Sound: ${soundActive ? "ON" : "OFF"}`}
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
              {status === "disconnected" && (
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
              className={`ps5-tile ${activeTile === "desktop" ? "active" : ""}`}
              onClick={() => handleTileSelect("desktop")}
              aria-pressed={activeTile === "desktop"}
              aria-label="Desktop Host Device"
            >
              <div className="tile-icon">
                <IconDesktop />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Desktop</span>
                <span className="tile-role">Host Device</span>
              </div>
            </button>
            <button
              type="button"
              className={`ps5-tile ${activeTile === "service" ? "active" : ""}`}
              onClick={() => handleTileSelect("service")}
              aria-pressed={activeTile === "service"}
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
              className={`ps5-tile ${activeTile === "storage" ? "active" : ""}`}
              onClick={() => handleTileSelect("storage")}
              aria-pressed={activeTile === "storage"}
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
            <button
              type="button"
              className={`ps5-tile ${activeTile === "client" ? "active" : ""}`}
              onClick={() => handleTileSelect("client")}
              aria-pressed={activeTile === "client"}
              aria-label="Web Client Remote Pair"
            >
              <div className="tile-icon">
                <IconWebClient />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Web Client</span>
                <span className="tile-role">Remote Pair</span>
              </div>
            </button>
          </div>
        </section>

        {/* Main Content Sections based on Active Tab */}
        {activeTab === "pairing" && (
          <section className="ps5-details-section" key="pairing">
            <div className="ps5-section-header">
              <div className="ps5-edition-badge">
                <span className="ps-gold-pill">AUTHENTICATION</span>
                <span className="ps-meta-text">Server-Verified Pairing</span>
              </div>
              <h1 className="ps5-game-title">Secure Device Pairing</h1>
              <p className="ps5-game-desc">
                Hubungkan browser atau client eksternal dengan memasukkan kode pairing di bawah pada Web Platform. Sesi dilindungi oleh token 256-bit dan kode tantangan anti-brute force.
              </p>
            </div>

            {!pairedSession ? (
              <div className="ps5-pair-action-box">
                {pairingInfo ? (
                  <>
                    {/* Signature Reference Command Capsule */}
                    <div className="form-pill-container">
                      <div className="cmd-code-text">{pairingInfo.pairCode}</div>
                      <button
                        type="button"
                        className="btn-icon-copy"
                        onClick={handleCopyCode}
                        aria-label="Copy Pairing Code"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="ps5-meta-pills-row">
                      <div className="ps-meta-chip">
                        <span className="chip-key">Challenge (ccode):</span>
                        <span className="chip-val">{pairingInfo.ccode}</span>
                      </div>
                      <div className="ps-meta-chip">
                        <span className="chip-key">Device Slug:</span>
                        <span className="chip-val">{pairingInfo.slug}</span>
                      </div>
                      <div className="ps-meta-chip">
                        <span className="chip-key">Token:</span>
                        <span className="chip-val">{pairingInfo.token.slice(0, 12)}...</span>
                      </div>
                    </div>

                    <div className="ps5-actions-row">
                      <button
                        type="button"
                        className="ps5-btn-secondary"
                        onClick={() => {
                          sound.playBadge();
                          requestNewPairCode();
                        }}
                      >
                        Buat Kode Baru
                      </button>
                      <span className="ps5-helper-note">Kode valid selama 10 menit (max 5x percobaan).</span>
                    </div>
                  </>
                ) : (
                  <div className="ps5-loading-offer">
                    {status === "disconnected"
                      ? "Server WebSocket sedang tidak terhubung. Periksa koneksi ke web-service."
                      : "Menghasilkan kode pairing aman dari server..."}
                  </div>
                )}
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
                      <div className="stream-empty">Belum ada pesan. Kirim pesan ke Web Platform melalui formulir di bawah.</div>
                    ) : (
                      secureMessages.map((msg, i) => (
                        <div key={i} className="stream-line">
                          <span className="sender-tag">[{msg.sender}]</span>
                          <span className="time-tag">{msg.time}:</span>
                          <span className="msg-payload">{msg.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="ps5-capsule-form" onSubmit={handleSendSecure}>
                    <span className="capsule-prefix">&gt;</span>
                    <input
                      type="text"
                      className="capsule-input"
                      value={secureInput}
                      onChange={(e) => setSecureInput(e.target.value)}
                      placeholder="Kirim pesan ke Web Platform..."
                    />
                    <button type="submit" className="capsule-submit-btn" disabled={!secureInput.trim()}>
                      <span>Kirim</span>
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

        {/* Live Stream / Console Tab */}
        {activeTab === "console" && (
          <section className="ps5-details-section" key="console">
            <div className="ps5-section-header">
              <div className="ps5-edition-badge">
                <span className="ps-gold-pill">STREAM LOGS</span>
                <span className="ps-meta-text">Target: {serverUrl}</span>
              </div>
              <h1 className="ps5-game-title">WebSocket Event Stream</h1>
              <p className="ps5-game-desc">
                Monitoring komunikasi real-time, heartbeat ping-pong, dan transit data antara Desktop Platform dan Web Service.
              </p>
            </div>

            <div className="subpage-step-code-card">
              <pre className="stream-pre">
                {secureMessages.length === 0 ? (
                  <code>[system] Menunggu aktivitas data pada socket {serverUrl}...</code>
                ) : (
                  secureMessages.map((msg, i) => (
                    <code key={i} className="code-line">
                      <span className="code-time">{msg.time}</span> <span className="code-sender">{msg.sender}</span>: {msg.text}
                    </code>
                  ))
                )}
              </pre>
            </div>
          </section>
        )}

        {/* Web Service Hub Tab */}
        {activeTab === "service" && (
          <section className="ps5-details-section" key="service">
            <div className="ps5-section-header">
              <div className="ps5-edition-badge">
                <span className="ps-gold-pill">NETWORK TARGET</span>
                <span className="ps-meta-text">Domain & Endpoint Configuration &bull; Port 8080</span>
              </div>
              <h1 className="ps5-game-title">Server Connection</h1>
              <p className="ps5-game-desc">
                Arahkan target komunikasi WebSocket ke server lokal atau domain terdaftar di cloud.
              </p>
            </div>

            <div className="ps5-config-box">
              <div className="ps5-presets-row">
                <button
                  type="button"
                  className={`ps5-preset-btn ${serverUrl === "ws://localhost:8080" ? "active" : ""}`}
                  onClick={() => {
                    sound.playEnter();
                    changeServerUrl("ws://localhost:8080");
                  }}
                >
                  Localhost (ws://localhost:8080)
                </button>
                <button
                  type="button"
                  className={`ps5-preset-btn ${serverUrl === "ws://127.0.0.1:8080" ? "active" : ""}`}
                  onClick={() => {
                    sound.playEnter();
                    changeServerUrl("ws://127.0.0.1:8080");
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
                  placeholder="Custom WebSocket URL (misal: 192.168.1.50:8080 atau wss://...)"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  spellCheck={false}
                />
                <button type="submit" className="capsule-submit-btn" disabled={!customUrlInput.trim()}>
                  <span>Set Target URL</span>
                </button>
              </form>

              {/* Dual Storage Resource Metrics */}
              <div className="ps5-storage-grid" style={{ marginTop: '20px' }}>
                {/* Rust Host Native Disk */}
                <div className="storage-status-card">
                  <div className="storage-card-header">
                    <span className="card-tag">RUST HOST STORAGE (LOCAL DISK)</span>
                    <button
                      type="button"
                      className="btn-storage-refresh"
                      onClick={fetchHostStorage}
                      disabled={hostStorageLoading}
                      title="Perbarui info storage dari native Rust"
                    >
                      <span>{hostStorageLoading ? "Reading..." : "Refresh Rust"}</span>
                    </button>
                  </div>
                  {hostStorage ? (
                    <div className="storage-meter-body">
                      <div className="storage-metric-row">
                        <div className="metric-col">
                          <span className="metric-label">Total Disk:</span>
                          <span className="metric-val">{hostStorage.totalFormatted}</span>
                        </div>
                        <div className="metric-col">
                          <span className="metric-label">Terpakai:</span>
                          <span className="metric-val text-used">{hostStorage.usedFormatted}</span>
                        </div>
                        <div className="metric-col">
                          <span className="metric-label">Tersedia (Free):</span>
                          <span className="metric-val text-free">{hostStorage.freeFormatted}</span>
                        </div>
                      </div>

                      <div className="ps5-meter-track" title={`${hostStorage.usedPercentage}% terpakai`}>
                        <div
                          className="ps5-meter-fill fill-cyan"
                          style={{ width: `${Math.min(100, hostStorage.usedPercentage)}%` }}
                        />
                      </div>
                      <div className="meter-footer-info">
                        <span>Path: <code>{hostStorage.path}</code></span>
                        <span className="meter-percent">{hostStorage.usedPercentage}% terpakai</span>
                      </div>
                    </div>
                  ) : (
                    <p className="diag-hint">Memuat data penyimpanan perangkat melalui Rust native bridge...</p>
                  )}
                </div>

                {/* Web Service Hub Disk */}
                <div className="storage-status-card">
                  <div className="storage-card-header">
                    <span className="card-tag">WEB-SERVICE STORAGE (PORT 8080)</span>
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
                          className="ps5-meter-fill fill-gold"
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
                      {status === "initialized" || status === "connected"
                        ? "Menunggu transmisi metrik storage dari web-service..."
                        : "Hubungkan WebSocket ke web-service untuk melihat kapasitas storage server."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Web Storage CDN Tab */}
        {activeTab === "storage" && (
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
                      {storageChecking ? "Memeriksa..." : "Check CDN Health"}
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
                          <span className="diag-v">{storageHealth.cdnFolder || "cdn-global"}</span>
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
                              <span className="diag-v-ok">{storageHealth.storage.usedFormatted} ({storageHealth.storage.usedPercentage}%)</span>
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

        {/* Native Tauri Rust IPC Footer Card */}
        <footer className="ps5-ipc-footer">
          <div className="ipc-info">
            <span className="ipc-badge">TAURI IPC</span>
            <span className="ipc-sub">Rust Native Backend Bridge</span>
          </div>
          <form
            className="ps5-capsule-form ipc-capsule-form"
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
          >
            <span className="capsule-prefix">rust&gt;</span>
            <input
              id="greet-input"
              className="capsule-input"
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="Masukkan nama untuk greet native Rust..."
              value={name}
            />
            <button type="submit" className="capsule-submit-btn" disabled={!name.trim()}>
              <span>Greet Native</span>
            </button>
          </form>
          {greetMsg && <div className="ipc-msg">{greetMsg}</div>}
        </footer>

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
          <span className="bottom-version">Omni Foundation Desktop v3.0</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
