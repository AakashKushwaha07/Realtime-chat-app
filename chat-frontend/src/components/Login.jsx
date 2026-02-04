import React, { useEffect, useMemo, useState } from "react";
const API = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function Login({ setUser }) {
  const [username, setUsername] = useState(""); // only for register (display name)
  const [email, setEmail] = useState(""); // login ID
  const [password, setPassword] = useState("");

  // Forgot/reset UI state
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot" | "reset"
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [tokenFromServer, setTokenFromServer] = useState("");

  // extras
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const clearAlerts = () => {
    setMsg("");
    setErr("");
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    const tokenParam = params.get("token");

    if (modeParam === "reset" && tokenParam) {
      setMode("reset");
      setResetToken(tokenParam);
      setMsg("✅ Link verified. Please set a new password.");
      setErr("");
    }
  }, []);

  const title = useMemo(() => {
    if (mode === "login") return "Welcome back";
    if (mode === "register") return "Create your account";
    if (mode === "forgot") return "Forgot password";
    return "Reset password";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "login") return "Login to continue chatting.";
    if (mode === "register") return "Join the chat in less than a minute.";
    if (mode === "forgot") return "We’ll help you get back in.";
    return "Choose a strong new password.";
  }, [mode]);

  const readError = async (res) => {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      return j.message || j.error || text;
    } catch {
      return text;
    }
  };

  const register = async () => {
    clearAlerts();
    if (!username || !email || !password) {
      setErr("Username, email, and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        setErr(await readError(res));
        return;
      }

      setMsg("✅ Registered successfully. Now login.");
      setMode("login");
      setPassword("");
    } catch (e) {
      setErr("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    clearAlerts();
    if (!email || !password) {
      setErr("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setErr(await readError(res));
        return;
      }

      const user = await res.json();
      setUser(user);
    } catch (e) {
      setErr("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async () => {
    clearAlerts();
    setTokenFromServer("");
    if (!email) {
      setErr("Email is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const text = await res.text();

      if (!res.ok) {
        setErr(text);
        return;
      }

      setMsg("✅ Check your email for reset token.");
      // setTokenFromServer(text); // dev only
      setMode("reset");
    } catch (e) {
      setErr("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordCall = async () => {
    clearAlerts();
    if (!resetToken || !newPassword) {
      setErr("Reset token and new password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password: newPassword }),
      });

      const text = await res.text();

      if (!res.ok) {
        setErr(text);
        return;
      }

      setMsg("✅ Password reset successful. Now login.");
      window.history.replaceState({}, document.title, "/");
      setMode("login");
      setResetToken("");
      setNewPassword("");
      setPassword("");
    } catch (e) {
      setErr("Network error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const primaryAction = () => {
    if (mode === "login") return login;
    if (mode === "register") return register;
    if (mode === "forgot") return forgotPassword;
    return resetPasswordCall;
  };

  const primaryLabel = () => {
    if (mode === "login") return loading ? "Logging in..." : "Login";
    if (mode === "register") return loading ? "Creating..." : "Create account";
    if (mode === "forgot") return loading ? "Sending..." : "Send reset token";
    return loading ? "Resetting..." : "Reset password";
  };

  const disabledPrimary = useMemo(() => {
    if (loading) return true;
    if (mode === "login") return !email || !password;
    if (mode === "register") return !username || !email || !password;
    if (mode === "forgot") return !email;
    return !resetToken || !newPassword;
  }, [loading, mode, username, email, password, resetToken, newPassword]);

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.shell}>
        {/* Left brand panel (hidden on small screens) */}
        <div style={styles.brandPane}>
          <div style={styles.logo}>💬</div>
          <h1 style={styles.brandTitle}>Chat App</h1>
          <p style={styles.brandText}>
            A clean, fast and secure chat experience.
            <br />
            Login to continue.
          </p>

          <div style={styles.featureList}>
            <Feature text="Secure authentication" />
            <Feature text="Real-time messaging" />
            <Feature text="Forgot/Reset support" />
          </div>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.kicker}>Account</div>
              <h2 style={styles.title}>{title}</h2>
              <p style={styles.subtitle}>{subtitle}</p>
            </div>
          </div>

          {/* Alerts */}
          {err && (
            <div style={{ ...styles.alert, ...styles.alertErr }}>
              <div style={styles.alertDot} />
              <div>
                <div style={styles.alertTitle}>Error</div>
                <div style={styles.alertText}>{err}</div>
              </div>
              <button onClick={() => setErr("")} style={styles.alertClose} aria-label="Close error">
                ✕
              </button>
            </div>
          )}

          {msg && (
            <div style={{ ...styles.alert, ...styles.alertOk }}>
              <div style={styles.alertDot} />
              <div>
                <div style={styles.alertTitle}>Success</div>
                <div style={styles.alertText}>{msg}</div>
              </div>
              <button onClick={() => setMsg("")} style={styles.alertClose} aria-label="Close success">
                ✕
              </button>
            </div>
          )}

          <div style={styles.form}>
            {mode === "register" && (
              <Field
                label="Username"
                placeholder="Your display name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}

            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <Field
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}

            {(mode === "login" || mode === "register") && (
              <PasswordField
                label="Password"
                placeholder="Enter your password"
                value={password}
                show={showPass}
                setShow={setShowPass}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {mode === "reset" && (
              <>
                <Field
                  label="Reset Token"
                  placeholder="Paste your token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
                <PasswordField
                  label="New Password"
                  placeholder="Create a new password"
                  value={newPassword}
                  show={showNewPass}
                  setShow={setShowNewPass}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                {tokenFromServer && (
                  <div style={styles.devBox}>
                    <div style={styles.devTitle}>Token response (dev)</div>
                    <div style={styles.devText}>{tokenFromServer}</div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={primaryAction()}
              disabled={disabledPrimary}
              style={{
                ...styles.primaryBtn,
                ...(disabledPrimary ? styles.primaryBtnDisabled : {}),
              }}
            >
              {loading ? <Spinner /> : null}
              <span style={{ marginLeft: loading ? 10 : 0 }}>{primaryLabel()}</span>
            </button>

            {/* Navigation */}
            <div style={styles.navRow}>
              {mode !== "login" && (
                <LinkBtn
                  onClick={() => {
                    clearAlerts();
                    setMode("login");
                  }}
                >
                  Back to login
                </LinkBtn>
              )}

              {mode !== "register" && (
                <LinkBtn
                  onClick={() => {
                    clearAlerts();
                    setMode("register");
                  }}
                >
                  Create account
                </LinkBtn>
              )}

              {mode !== "forgot" && (
                <LinkBtn
                  onClick={() => {
                    clearAlerts();
                    setMode("forgot");
                  }}
                >
                  Forgot password?
                </LinkBtn>
              )}
            </div>

            <div style={styles.footerHint}>
              By continuing you agree to basic app policies.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Small UI components ----------------- */

function Feature({ text }) {
  return (
    <div style={styles.featureItem}>
      <span style={styles.featureDot} />
      <span>{text}</span>
    </div>
  );
}

function Field({ label, type = "text", placeholder, value, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        style={styles.input}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="on"
      />
    </div>
  );
}

function PasswordField({ label, placeholder, value, onChange, show, setShow }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.passWrap}>
        <input
          style={{ ...styles.input, paddingRight: 44 }}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          style={styles.eyeBtn}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

function LinkBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={styles.linkBtn} type="button">
      {children}
    </button>
  );
}

function Spinner() {
  return <span style={styles.spinner} aria-hidden="true" />;
}

/* ----------------- Styles (inline) ----------------- */

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "28px 14px",
    background:
      "radial-gradient(1200px 800px at 20% 10%, #dbeafe 0%, rgba(219,234,254,0) 60%), radial-gradient(1000px 800px at 90% 30%, #fce7f3 0%, rgba(252,231,243,0) 55%), linear-gradient(180deg, #0b1020 0%, #0b1020 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },

  bgGlow1: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 999,
    filter: "blur(70px)",
    opacity: 0.18,
    background: "linear-gradient(135deg, #60a5fa, #a78bfa)",
    left: -120,
    top: -120,
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    width: 560,
    height: 560,
    borderRadius: 999,
    filter: "blur(70px)",
    opacity: 0.14,
    background: "linear-gradient(135deg, #fb7185, #f59e0b)",
    right: -160,
    bottom: -160,
    pointerEvents: "none",
  },

  shell: {
    width: "100%",
    maxWidth: 980,
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr",
    gap: 18,
    alignItems: "stretch",
  },

  brandPane: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 26,
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    color: "rgba(255,255,255,0.92)",
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    fontSize: 26,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    marginBottom: 14,
  },
  brandTitle: {
    margin: 0,
    fontSize: 30,
    letterSpacing: "-0.4px",
  },
  brandText: {
    marginTop: 10,
    marginBottom: 18,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.6,
  },
  featureList: {
    marginTop: 6,
    display: "grid",
    gap: 10,
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.85)",
    display: "inline-block",
  },

  card: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    overflow: "hidden",
    backdropFilter: "blur(10px)",
  },
  cardHeader: {
    padding: "22px 22px 8px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  kicker: {
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.65)",
  },
  title: {
    margin: "6px 0 0 0",
    fontSize: 22,
    letterSpacing: "-0.3px",
    color: "rgba(255,255,255,0.95)",
  },
  subtitle: {
    margin: "6px 0 0 0",
    fontSize: 13,
    color: "rgba(255,255,255,0.70)",
    lineHeight: 1.5,
  },

  form: {
    padding: 22,
  },

  alert: {
    margin: "14px 22px 0 22px",
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    position: "relative",
  },
  alertErr: {
    background: "rgba(239,68,68,0.14)",
  },
  alertOk: {
    background: "rgba(34,197,94,0.14)",
  },
  alertDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
    background: "rgba(255,255,255,0.85)",
    flex: "0 0 auto",
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.92)",
  },
  alertText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
    lineHeight: 1.35,
  },
  alertClose: {
    position: "absolute",
    top: 10,
    right: 10,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.75)",
    cursor: "pointer",
    fontSize: 14,
  },

  field: { marginTop: 12 },
  label: {
    display: "block",
    fontSize: 12,
    marginBottom: 6,
    color: "rgba(255,255,255,0.75)",
  },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },

  passWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 16,
    opacity: 0.9,
  },

  primaryBtn: {
    marginTop: 16,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(135deg, rgba(96,165,250,0.9), rgba(167,139,250,0.9))",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 700,
    letterSpacing: "0.2px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  spinner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.55)",
    borderTopColor: "rgba(255,255,255,0.0)",
    display: "inline-block",
    animation: "spin 0.9s linear infinite",
  },

  navRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: "rgba(191,219,254,0.95)",
    cursor: "pointer",
    fontSize: 13,
    padding: "6px 8px",
  },

  footerHint: {
    marginTop: 14,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },

  devBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
    overflowWrap: "anywhere",
  },
  devTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(255,255,255,0.88)",
  },
  devText: {
    marginTop: 8,
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.4,
  },
};

/* Inject keyframes once (inline styles can't define @keyframes directly) */
if (typeof document !== "undefined" && !document.getElementById("login-spin-kf")) {
  const style = document.createElement("style");
  style.id = "login-spin-kf";
  style.innerHTML = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media (max-width: 900px) {
      /* Hide left panel on smaller screens */
      ._brandPane { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}
