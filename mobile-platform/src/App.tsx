import { useState, useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useWebSocket } from "./hooks/useWebSocket";
import { sound } from "./utils/sound";
import {
  IconMobile,
  IconDesktop,
  IconServiceHub,
  IconStorageCDN,
  IconAlert
} from "./components/Icons";
import { AmbientBackground } from "./components/AmbientBackground";
import { ENV } from "./config/env";
import type {
  StorageStatsPayload,
  MobileDeviceInfoPayload
} from "./types/websocket";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"pairing" | "console" | "service" | "storage">("pairing");
  const [activeTile, setActiveTile] = useState<"mobile" | "desktop" | "service" | "storage">("mobile");
  const [soundActive, setSoundActive] = useState<boolean>(sound.isEnabled());

  // Segmented 8-digit OTP PIN input state for mobile
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", "", "", ""]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mobile native device info and storage
  const [mobileInfo, setMobileInfo] = useState<MobileDeviceInfoPayload | null>(null);
  const [hostStorage, setHostStorage] = useState<StorageStatsPayload | null>(null);
  const [hostStorageLoading, setHostStorageLoading] = useState<boolean>(false);

  // Web storage health check
  const [storageTestFilename, setStorageTestFilename] = useState<string>("");
  const [storageChecking, setStorageChecking] = useState<boolean>(false);
  const [storageHealth, setStorageHealth] = useState<{
    status: string;
    cdnFolder?: string;
    service?: string;
    storage?: StorageStatsPayload;
  } | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // PS5 Authentic Boot Sequence
  const [showBoot, setShowBoot] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("omni_mobile_boot_dismissed") !== "true";
  });
  const [bootPlaying, setBootPlaying] = useState<boolean>(false);

  // Dynamic glider sliding indicator measurement
  const tabsRef = useRef<HTMLElement>(null);
  const [gliderStyle, setGliderStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const {
    serverUrl,
    changeServerUrl,
    status,
    pairingInfo,
    pairedSession,
    pairError,
    secureMessages,
    submitPair,
    sendSecureMessage,
    requestNewPairCode,
    reconnect,
    serverStorage,
    requestServerStorage
  } = useWebSocket();

  // Query Rust native mobile storage and device information
  const fetchMobileNativeData = useCallback(async () => {
    setHostStorageLoading(true);
    try {
      const stats = await invoke<StorageStatsPayload>("get_storage_stats");
      setHostStorage(stats);
    } catch (err) {
      console.warn("Native Rust mobile storage unavailable:", err);
    } finally {
      setHostStorageLoading(false);
    }

    try {
      const info = await invoke<MobileDeviceInfoPayload>("get_mobile_device_info");
      setMobileInfo(info);
    } catch (err) {
      console.warn("Native Rust mobile device info unavailable:", err);
    }
  }, []);

  useEffect(() => {
    fetchMobileNativeData();
  }, [fetchMobileNativeData]);

  // PS5 Startup sequence
  useEffect(() => {
    if (!showBoot) return;

    const bootTimer = setTimeout(() => {
      setBootPlaying(true);
      sound.playStartup();
    }, 100);

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
      sessionStorage.setItem("omni_mobile_boot_dismissed", "true");
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

  // OTP PIN helpers
  const part1 = pinDigits.slice(0, 4).join("");
  const part2 = pinDigits.slice(4, 8).join("");
  const filledCount = pinDigits.filter((d) => d.length === 1).length;
  const isPinComplete = filledCount === 8;
  const fullPairCode = isPinComplete ? `PAIR-${part1}-${part2}` : "";
  const ccode = isPinComplete ? part2 : "";

  function populateDigitsFromRaw(raw: string) {
    let clean = raw.toUpperCase().replace(/\s+/g, "");
    if (clean.startsWith("PAIR-")) {
      clean = clean.slice(5);
    } else if (clean.startsWith("PAIR")) {
      clean = clean.slice(4);
    }
    clean = clean.replace(/[^A-Z0-9]/g, "");

    const nextDigits = ["", "", "", "", "", "", "", ""];
    for (let i = 0; i < 8 && i < clean.length; i++) {
      if (i < 4) {
        nextDigits[i] = clean[i];
      } else if (/[0-9]/.test(clean[i])) {
        nextDigits[i] = clean[i];
      }
    }
    setPinDigits(nextDigits);

    const nextFocusIndex = Math.min(clean.length, 7);
    pinInputRefs.current[nextFocusIndex]?.focus();
  }

  function handleDigitChange(idx: number, val: string) {
    const char = val.slice(-1).toUpperCase();

    if (idx < 4) {
      if (!char || /[A-Z0-9]/.test(char)) {
        updateDigitSlot(idx, char);
      }
    } else {
      if (!char || /[0-9]/.test(char)) {
        updateDigitSlot(idx, char);
      }
    }
  }

  function updateDigitSlot(idx: number, char: string) {
    const nextDigits = [...pinDigits];
    nextDigits[idx] = char;
    setPinDigits(nextDigits);

    if (char) {
      sound.playNav();
      if (idx < 7) {
        pinInputRefs.current[idx + 1]?.focus();
      }
    }
  }

  function handleDigitKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (!pinDigits[idx] && idx > 0) {
        e.preventDefault();
        const nextDigits = [...pinDigits];
        nextDigits[idx - 1] = "";
        setPinDigits(nextDigits);
        pinInputRefs.current[idx - 1]?.focus();
        sound.playNav();
      } else if (pinDigits[idx]) {
        const nextDigits = [...pinDigits];
        nextDigits[idx] = "";
        setPinDigits(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      pinInputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 7) {
      e.preventDefault();
      pinInputRefs.current[idx + 1]?.focus();
    }
  }

  function handleDigitPaste(_idx: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;
    sound.playEnter();
    populateDigitsFromRaw(pasted);
  }

  function handleClearDigits() {
    sound.playNav();
    setPinDigits(["", "", "", "", "", "", "", ""]);
    pinInputRefs.current[0]?.focus();
  }

  // Dynamic glider sliding indicator measurement with ResizeObserver
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

  // Derive dynamic storage host from serverUrl if custom LAN address is used
  const getEffectiveStorageBase = useCallback(() => {
    try {
      const wsUrlObj = new URL(serverUrl);
      if (wsUrlObj.hostname && wsUrlObj.hostname !== "localhost" && wsUrlObj.hostname !== "127.0.0.1") {
        return `http://${wsUrlObj.hostname}:9000`;
      }
    } catch {}
    return ENV.DEFAULT_STORAGE_URL.replace(/\/+$/, "");
  }, [serverUrl]);

  async function handleCheckStorageHealth() {
    sound.playEnter();
    setStorageChecking(true);
    setStorageError(null);
    const storageBase = getEffectiveStorageBase();
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
    const storageBase = getEffectiveStorageBase();
    window.open(`${storageBase}/cdn/${encodeURIComponent(cleanName)}`, "_blank", "noopener,noreferrer");
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

  async function handleGreet(e: React.FormEvent) {
    e.preventDefault();
    sound.playEnter();
    try {
      const res = await invoke<string>("greet", { name });
      setGreetMsg(res);
    } catch (err) {
      setGreetMsg(`Rust command error: ${err}`);
    }
  }

  function handleServerChange(e: React.FormEvent) {
    e.preventDefault();
    if (customUrlInput.trim()) {
      sound.playEnter();
      changeServerUrl(customUrlInput.trim());
      setCustomUrlInput("");
    }
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sound.playEnter();
    sendSecureMessage(chatMessage);
    setChatMessage("");
  }

  function handleTabChange(tab: "pairing" | "console" | "service" | "storage") {
    if (activeTab !== tab) {
      sound.playHubTab();
      setActiveTab(tab);
      const mappedTile: "mobile" | "desktop" | "service" | "storage" =
        tab === "pairing" ? "mobile" : tab === "console" ? "desktop" : tab;
      setActiveTile(mappedTile);
    }
  }

  function handleTileSelect(tile: "mobile" | "desktop" | "service" | "storage") {
    if (activeTile === tile) {
      sound.playEnter();
    } else {
      sound.playNav();
      setActiveTile(tile);
      const mappedTab: "pairing" | "console" | "service" | "storage" =
        tile === "mobile" ? "pairing" : tile === "desktop" ? "console" : tile;
      setActiveTab(mappedTab);
    }
  }

  function handleCopy(text: string) {
    sound.playEnter();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggleSound() {
    const nextState = sound.toggleSound();
    setSoundActive(nextState);
  }

  const getStatusColor = () => {
    switch (status) {
      case "initialized":
        return "#10b981"; // Emerald
      case "connected":
        return "#38bdf8"; // Sky Blue
      case "connecting":
        return "#fbbf24"; // Amber
      case "error":
        return "#ef4444"; // Rose Red
      default:
        return "#64748b"; // Slate Grey
    }
  };

  return (
    <div className="ps5-app-wrapper mobile-mode">
      {/* Authentic Console Startup Intro */}
      {showBoot && (
        <div
          className={`ps5-boot-screen ${bootPlaying ? "is-playing" : ""}`}
          onClick={() => dismissBoot()}
          role="region"
          aria-label="Omni Mobile Intro"
        >
          <div className="ps5-boot-center">
            <span className="ps5-boot-badge">OMNI MOBILE SYSTEM HUB</span>
            <h1 className="ps5-boot-title">/omni</h1>
            <div className="ps5-boot-subline">Initializing mobile secure environment...</div>
            <div className="ps5-boot-hint">Ketuk di mana saja untuk lanjut</div>
          </div>
        </div>
      )}

      {/* Animated Background Canvas */}
      <AmbientBackground />

      {/* Atmosphere Glow & Vignette */}
      <div className="ps5-glow-beam" />
      <div className="ps5-vignette" />

      <main className="ps5-main-container mobile-container">
        {/* Mobile Topbar Navigation */}
        <header className="ps5-topbar mobile-topbar">
          <div className="ps5-brand-block">
            <span className="ps5-brand-title">OMNI</span>
            <span className="ps5-badge-pill">MOBILE</span>
          </div>

          <div className="ps5-system-bar mobile-sys-bar">
            {/* Replay Intro Button */}
            <button
              type="button"
              className="ps5-sys-btn-pill"
              onClick={handleReplayBoot}
              title="Replay Intro"
            >
              Intro
            </button>

            {/* Sound Toggle Button */}
            <button
              type="button"
              className="ps5-sound-toggle-btn"
              onClick={handleToggleSound}
              aria-label="Toggle Sound"
              title={`Sound: ${soundActive ? "ON" : "OFF"}`}
            >
              {soundActive ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            <div className="ps5-status-group">
              <div className="ps5-status-pill" title={`WebSocket: ${status}`}>
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

          {/* Mobile Hub Navigation Tabs */}
          <nav className="ps5-hub-tabs mobile-tabs" ref={tabsRef} aria-label="Mobile Navigation">
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "pairing" ? "active" : ""}`}
              onClick={() => handleTabChange("pairing")}
            >
              Pairing
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "console" ? "active" : ""}`}
              onClick={() => handleTabChange("console")}
            >
              Stream
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "service" ? "active" : ""}`}
              onClick={() => handleTabChange("service")}
            >
              Service
            </button>
            <button
              type="button"
              className={`ps5-hub-tab ${activeTab === "storage" ? "active" : ""}`}
              onClick={() => handleTabChange("storage")}
            >
              Storage
            </button>
            <div className="ps5-hub-tabs-glider" style={gliderStyle} aria-hidden="true" />
          </nav>
        </header>

        {/* Mobile Touch Service Ribbon Carousel */}
        <section className="ps5-ribbon-section mobile-ribbon" aria-label="Ecosystem Services">
          <div className="ps5-tiles-track mobile-track" role="toolbar" aria-label="Select platform view">
            <button
              type="button"
              className={`ps5-tile ${activeTile === "mobile" ? "active" : ""}`}
              onClick={() => handleTileSelect("mobile")}
              aria-pressed={activeTile === "mobile"}
              aria-label="Mobile Platform iOS Android"
            >
              <div className="tile-icon">
                <IconMobile />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Mobile</span>
                <span className="tile-role">Tauri v2</span>
              </div>
            </button>
            <button
              type="button"
              className={`ps5-tile ${activeTile === "desktop" ? "active" : ""}`}
              onClick={() => handleTileSelect("desktop")}
              aria-pressed={activeTile === "desktop"}
              aria-label="Desktop Platform Host"
            >
              <div className="tile-icon">
                <IconDesktop />
              </div>
              <div className="tile-meta">
                <span className="tile-name">Desktop</span>
                <span className="tile-role">Host Peer</span>
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
                <span className="tile-name">Service</span>
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
                <span className="tile-name">Storage</span>
                <span className="tile-role">Port 9000</span>
              </div>
            </button>
          </div>
        </section>

        {/* Main Content Sections based on Active Tab */}
        {activeTab === "pairing" && (
          <section className="ps5-details-section mobile-details" key="pairing">
            <div className="ps5-section-header">
              <span className="ps5-section-tag">MOBILE DEVICE PAIRING</span>
              <h1 className="ps5-game-title">Mobile Connect</h1>
              <p className="ps5-game-desc">
                Hubungkan perangkat mobile (iOS & Android) ke ekosistem Omni melalui enkripsi point-to-point. Masukkan PIN digit atau gunakan penawaran pairing perangkat.
              </p>
            </div>

            <div className="ps5-content-body">
              {/* Paired Alert */}
              {pairedSession && (
                <div className="ps5-paired-alert">
                  <div className="alert-badge">TERHUBUNG</div>
                  <div className="alert-body">
                    <strong>Terkoneksi dengan {pairedSession.peerClient.name || pairedSession.peerClient.clientType}</strong>
                    <span>Session: <code>{pairedSession.pairSessionId.slice(0, 14)}...</code></span>
                  </div>
                </div>
              )}

              {/* Pair Error Alert */}
              {pairError && (
                <div className="ps5-error-alert">
                  <IconAlert />
                  <span>{pairError}</span>
                </div>
              )}

              {/* Segmented OTP PIN Input for Mobile */}
              <div className="ps5-card-glass mobile-card">
                <div className="card-subhead">
                  <span className="subhead-dot" />
                  <span>MASUKKAN KODE PAIRING (OTP DIGIT)</span>
                </div>

                <form onSubmit={handlePairSubmit} className="ps5-otp-form">
                  <div className="ps5-otp-container">
                    <div className="ps5-otp-track">
                      <div className="otp-prefix-box">PAIR</div>
                      <div className="otp-divider">-</div>

                      {/* Part 1: 4 Alphanumeric Digits */}
                      <div className="otp-group">
                        {[0, 1, 2, 3].map((slotIdx) => (
                          <input
                            key={`pin-${slotIdx}`}
                            ref={(el) => { pinInputRefs.current[slotIdx] = el; }}
                            type="text"
                            inputMode="text"
                            autoCapitalize="characters"
                            autoComplete="off"
                            autoCorrect="off"
                            maxLength={1}
                            className={`otp-digit-slot ${pinDigits[slotIdx] ? "filled" : ""}`}
                            value={pinDigits[slotIdx]}
                            onChange={(e) => handleDigitChange(slotIdx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(slotIdx, e)}
                            onPaste={(e) => handleDigitPaste(slotIdx, e)}
                            aria-label={`Digit ${slotIdx + 1}`}
                          />
                        ))}
                      </div>

                      <div className="otp-divider">-</div>

                      {/* Part 2: 4 Numeric Digits (Challenge Code) */}
                      <div className="otp-group">
                        {[4, 5, 6, 7].map((slotIdx) => (
                          <input
                            key={`pin-${slotIdx}`}
                            ref={(el) => { pinInputRefs.current[slotIdx] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            autoComplete="off"
                            maxLength={1}
                            className={`otp-digit-slot ${pinDigits[slotIdx] ? "filled" : ""}`}
                            value={pinDigits[slotIdx]}
                            onChange={(e) => handleDigitChange(slotIdx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(slotIdx, e)}
                            onPaste={(e) => handleDigitPaste(slotIdx, e)}
                            aria-label={`Digit ${slotIdx + 1} (Challenge code)`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="otp-legend-row">
                      <span className="otp-legend-item">
                        {isPinComplete ? "8/8 DIGIT TERVERIFIKASI" : `${filledCount}/8 DIGIT TERISI`}
                      </span>
                      {filledCount > 0 && (
                        <button
                          type="button"
                          className="btn-otp-clear"
                          onClick={handleClearDigits}
                        >
                          Bersihkan
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="ps5-btn-affirmative mobile-btn-submit"
                    disabled={!isPinComplete || status !== "initialized"}
                  >
                    <span>Verifikasi & Hubungkan</span>
                  </button>
                </form>
              </div>

              {/* Mobile Host Pairing Offer Display */}
              <div className="ps5-card-glass mobile-card">
                <div className="card-subhead">
                  <span className="subhead-dot" />
                  <span>KODE PAIRING PERANGKAT INI (HOST OFFER)</span>
                </div>

                {pairingInfo ? (
                  <div className="ps5-offer-content">
                    <div className="form-pill-container mobile-pill">
                      <div className="pill-code-text">
                        <span className="code-prefix">$</span>
                        <span className="code-main">{pairingInfo.pairCode}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-icon-copy"
                        onClick={() => handleCopy(pairingInfo.pairCode)}
                        title="Salin kode pairing"
                        aria-label="Salin kode pairing"
                      >
                        {copied ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>

                    <div className="ps5-actions-row">
                      <button
                        type="button"
                        className="ps5-btn-secondary"
                        onClick={() => {
                          sound.playEnter();
                          requestNewPairCode();
                        }}
                      >
                        Perbarui Kode
                      </button>
                      <span className="ps5-helper-note">Challenge: <code>{pairingInfo.ccode}</code></span>
                    </div>
                  </div>
                ) : (
                  <div className="ps5-loading-offer">
                    <span>{status === "initialized" ? "Membuat penawaran pairing mobile..." : "Menghubungkan ke web-service WebSocket..."}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Live Stream / Console Tab */}
        {activeTab === "console" && (
          <section className="ps5-details-section mobile-details" key="console">
            <div className="ps5-section-header">
              <span className="ps5-section-tag">MOBILE LIVE STREAM</span>
              <h1 className="ps5-game-title">Live Messaging</h1>
              <p className="ps5-game-desc">
                Komunikasi terenkripsi point-to-point antara mobile, desktop, dan web client secara real-time.
              </p>
            </div>

            <div className="ps5-content-body">
              {pairedSession ? (
                <div className="ps5-chat-card mobile-card">
                  <div className="subpage-step-code-card mobile-code-card">
                    <div className="code-stream-inner">
                      {secureMessages.length === 0 ? (
                        <div className="empty-stream-msg">
                          Saluran aman aktif. Kirim pesan dari mobile untuk memulai percakapan.
                        </div>
                      ) : (
                        secureMessages.map((m, idx) => (
                          <div key={idx} className="stream-msg-line">
                            <span className="stream-timestamp">[{m.time}]</span>
                            <span className="stream-sender">&lt;{m.sender}&gt;</span>
                            <span className="stream-text">{m.text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSendChat} className="chat-input-capsule mobile-capsule">
                    <input
                      type="text"
                      className="chat-field"
                      placeholder="Ketik pesan aman..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <button type="submit" className="capsule-submit-btn">
                      Kirim
                    </button>
                  </form>
                </div>
              ) : (
                <div className="ps5-unpaired-banner">
                  <span className="banner-title">Belum Terhubung</span>
                  <p>Lakukan pairing dengan perangkat lain melalui tab Pairing untuk membuka saluran obrolan aman.</p>
                </div>
              )}

              {/* Native Rust IPC Tester on Mobile */}
              <div className="ps5-card-glass mobile-card">
                <div className="card-subhead">
                  <span className="subhead-dot" />
                  <span>RUST NATIVE IPC COMMAND (MOBILE CORE)</span>
                </div>
                <form onSubmit={handleGreet} className="ipc-form mobile-ipc">
                  <input
                    type="text"
                    className="ipc-input"
                    placeholder="Nama untuk disapa..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <button type="submit" className="ps5-btn-secondary">
                    Panggil Rust
                  </button>
                </form>
                {greetMsg && <div className="ipc-result">{greetMsg}</div>}
              </div>
            </div>
          </section>
        )}

        {/* Web Service Tab */}
        {activeTab === "service" && (
          <section className="ps5-details-section mobile-details" key="service">
            <div className="ps5-section-header">
              <span className="ps5-section-tag">CENTRAL SERVICE HUB</span>
              <h1 className="ps5-game-title">WebSocket Hub</h1>
              <p className="ps5-game-desc">
                Pusat komunikasi WebSocket port 8080. Konfigurasi alamat server dan pantau transmisi paket.
              </p>
            </div>

            <div className="ps5-content-body">
              {/* Dual Storage Progress Bars */}
              <div className="ps5-storage-grid mobile-storage-grid">
                {/* Mobile Device Storage */}
                <div className="storage-status-card">
                  <div className="storage-card-header">
                    <span className="card-tag">MOBILE FLASH STORAGE</span>
                    <button
                      type="button"
                      className="btn-storage-refresh"
                      onClick={() => {
                        sound.playEnter();
                        fetchMobileNativeData();
                      }}
                      title="Perbarui data storage mobile"
                    >
                      <span>{hostStorageLoading ? "Memuat..." : "Refresh"}</span>
                    </button>
                  </div>
                  {hostStorage ? (
                    <div className="storage-meter-body">
                      <div className="storage-metric-row">
                        <div className="metric-col">
                          <span className="metric-label">Total:</span>
                          <span className="metric-val">{hostStorage.totalFormatted}</span>
                        </div>
                        <div className="metric-col">
                          <span className="metric-label">Terpakai:</span>
                          <span className="metric-val text-used">{hostStorage.usedFormatted}</span>
                        </div>
                        <div className="metric-col">
                          <span className="metric-label">Free:</span>
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
                    <p className="diag-hint">Memuat metrik penyimpanan internal mobile...</p>
                  )}
                </div>

                {/* Web Service Storage */}
                <div className="storage-status-card">
                  <div className="storage-card-header">
                    <span className="card-tag">WEB-SERVICE HUB STORAGE</span>
                    <button
                      type="button"
                      className="btn-storage-refresh"
                      onClick={() => {
                        sound.playEnter();
                        requestServerStorage();
                      }}
                      title="Minta info storage terbaru via WebSocket"
                    >
                      <span>Refresh</span>
                    </button>
                  </div>
                  {serverStorage ? (
                    <div className="storage-meter-body">
                      <div className="storage-metric-row">
                        <div className="metric-col">
                          <span className="metric-label">Total:</span>
                          <span className="metric-val">{serverStorage.totalFormatted}</span>
                        </div>
                        <div className="metric-col">
                          <span className="metric-label">Terpakai:</span>
                          <span className="metric-val text-used">{serverStorage.usedFormatted}</span>
                        </div>
                        <div className="metric-col">
                          <span className="metric-label">Free:</span>
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
                        : "Hubungkan WebSocket untuk melihat kapasitas storage server."}
                    </p>
                  )}
                </div>
              </div>

              {/* Mobile Device Specs */}
              {mobileInfo && (
                <div className="ps5-card-glass mobile-card">
                  <div className="card-subhead">
                    <span className="subhead-dot" />
                    <span>SPESIFIKASI ENGINE MOBILE</span>
                  </div>
                  <div className="mobile-specs-grid">
                    <div className="spec-item">
                      <span className="spec-label">Platform OS</span>
                      <span className="spec-val">{mobileInfo.platform} ({mobileInfo.family})</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Arsitektur</span>
                      <span className="spec-val">{mobileInfo.arch}</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Runtime Core</span>
                      <span className="spec-val">{mobileInfo.engine}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Server URL Configuration Form */}
              <div className="ps5-card-glass mobile-card">
                <div className="card-subhead">
                  <span className="subhead-dot" />
                  <span>GANTI ALAMAT WEBSOCKET</span>
                </div>
                <form onSubmit={handleServerChange} className="ps5-pill-form mobile-pill-form">
                  <input
                    type="text"
                    className="ps5-pill-input"
                    placeholder={serverUrl}
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                  />
                  <button type="submit" className="ps5-btn-affirmative">
                    Terapkan
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Web Storage CDN Tab */}
        {activeTab === "storage" && (
          <section className="ps5-details-section mobile-details" key="storage">
            <div className="ps5-section-header">
              <span className="ps5-section-tag">STORAGE CDN SERVICE</span>
              <h1 className="ps5-game-title">Web Storage</h1>
              <p className="ps5-game-desc">
                Layanan HTTP CDN port 9000 untuk pengiriman aset statis dan berkas terlindungi.
              </p>
            </div>

            <div className="ps5-content-body">
              <div className="storage-status-card mobile-card">
                <div className="storage-card-header">
                  <span className="card-tag">CDN SERVICE HEALTH (PORT 9000)</span>
                  <button
                    type="button"
                    className="btn-storage-refresh"
                    onClick={handleCheckStorageHealth}
                    disabled={storageChecking}
                  >
                    <span>{storageChecking ? "Memeriksa..." : "Cek Status"}</span>
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
                        <span className="diag-k">Direktori:</span>
                        <span className="storage-folder-val">{storageHealth.cdnFolder || "cdn-global"}</span>
                      </div>
                      {storageHealth.storage && (
                        <div className="diag-line">
                          <span className="diag-k">Kapasitas:</span>
                          <span className="diag-v">{storageHealth.storage.totalFormatted} ({storageHealth.storage.freeFormatted} free)</span>
                        </div>
                      )}
                    </div>
                  ) : storageError ? (
                    <div className="diag-error">
                      <span>Error: {storageError}</span>
                    </div>
                  ) : (
                    <p className="diag-hint">Ketuk tombol Cek Status untuk memverifikasi layanan web-storage.</p>
                  )}
                </div>
              </div>

              {/* Asset Test Form */}
              <div className="ps5-card-glass mobile-card">
                <div className="card-subhead">
                  <span className="subhead-dot" />
                  <span>UJI AKSES FILE CDN</span>
                </div>
                <form onSubmit={handleTestAssetAccess} className="ps5-pill-form mobile-pill-form">
                  <input
                    type="text"
                    className="ps5-pill-input"
                    placeholder="namafile.jpg atau sample.png"
                    value={storageTestFilename}
                    onChange={(e) => setStorageTestFilename(e.target.value)}
                  />
                  <button type="submit" className="ps5-btn-secondary">
                    Buka File
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* Mobile Bottom Bar Dock */}
        <footer className="ps5-bottom-bar mobile-bottom-dock">
          <div className="bottom-keys">
            <span className="controller-key">TAP</span>
            <span className="key-hint">Pilih</span>
            <span className="controller-key">SWIPE</span>
            <span className="key-hint">Geser</span>
          </div>
          <div className="bottom-version">
            <span>Omni Mobile v0.1.0 (iOS / Android)</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

