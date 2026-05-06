import { useState } from "react";
import { FileText, Camera, Edit3 } from "lucide-react";
import FileDropZone from "./FileDropZone";
import ImageOCR from "./ImageOCR";

const MAX_CHARS = 40000;

export default function ContractInput({ value, onChange, disabled }) {
  const [activeTab, setActiveTab] = useState("upload"); // "upload" | "camera" | "paste"

  const handleTextExtracted = (text, sourceName) => {
    onChange(text.slice(0, MAX_CHARS));
    // Auto-switch to paste tab so user can see/edit extracted text
    setActiveTab("paste");
  };

  const tabStyle = (id) => ({
    flex: 1,
    padding: "7px 0",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontWeight: activeTab === id ? 600 : 500,
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    background: activeTab === id ? "var(--surface)" : "transparent",
    color: activeTab === id ? "var(--text)" : "var(--muted)",
    boxShadow: activeTab === id ? "0 1px 3px rgba(0,0,0,0.1), 0 0 0 1px var(--border)" : "none",
    transition: "all 0.15s",
  });

  const count = value ? value.length : 0;

  return (
    <div>
      {/* ── Step label ── */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ color: 'var(--muted)', fontSize: 12, margin: 0, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Step 3 — Input Contract
        </p>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex", gap: 4, padding: 4,
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 8, marginBottom: 12,
      }}>
        <button style={tabStyle("upload")} onClick={() => setActiveTab("upload")}>
          <FileText size={14} /> File / PDF
        </button>
        <button style={tabStyle("camera")} onClick={() => setActiveTab("camera")}>
          <Camera size={14} /> Photo / Scan
        </button>
        <button style={tabStyle("paste")} onClick={() => setActiveTab("paste")}>
          <Edit3 size={14} /> Paste text
        </button>
      </div>

      {/* File drop zone tab */}
      {activeTab === "upload" && (
        <FileDropZone
          onTextExtracted={handleTextExtracted}
          disabled={disabled}
        />
      )}

      {/* Camera / image OCR tab */}
      {activeTab === "camera" && (
        <>
          <ImageOCR
            onTextExtracted={handleTextExtracted}
            disabled={disabled}
          />
          {/* Photo tips for paper contracts */}
          <div style={{
            marginTop: 8, padding: "10px 12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8, fontSize: 11,
            color: "var(--muted)",
            lineHeight: 1.6,
          }}>
            <strong style={{ color: "var(--text)" }}>Tips for best results:</strong><br />
            • Flat surface, good natural light<br />
            • Hold phone directly above the paper<br />
            • All text must be visible in frame<br />
            • Works with Hindi + English documents
          </div>
        </>
      )}

      {/* Paste text tab */}
      {activeTab === "paste" && (
        <div style={{ position: "relative" }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
            disabled={disabled}
            placeholder="Paste your full contract, agreement, lease deed, privacy policy, or terms of service text here…"
            style={{
              width:        '100%',
              minHeight:    'max(160px, 30vh)',
              resize:       'vertical',
              background:   'var(--surface)',
              border:       '1px solid var(--border)',
              borderRadius: 10,
              color:        'var(--text)',
              fontSize:     13,
              padding:      '12px 14px',
              paddingBottom: 28,
              fontFamily:   'inherit',
              lineHeight:   1.6,
              outline:      'none',
              transition:   'border-color 200ms ease',
              boxSizing:    'border-box',
              opacity:      disabled ? 0.6 : 1,
              cursor:       disabled ? 'not-allowed' : 'text',
            }}
            onFocus={(e) => !disabled && (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')}
          />
          <span
            style={{
              position:  'absolute',
              bottom:    10,
              right:     12,
              fontSize:  11,
              color:     count > MAX_CHARS * 0.9 ? 'var(--warning)' : 'var(--muted)',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            {count.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      )}

      {/* Show char count + extracted text notice when text is ready */}
      {value && activeTab !== "paste" && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 8, fontSize: 12,
          color: "var(--success)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>✓ {count.toLocaleString()} characters ready to analyse</span>
          <button
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--success)", fontWeight: 600, fontSize: 11,
              textDecoration: "underline", padding: 0,
            }}
            onClick={() => setActiveTab("paste")}
          >
            Review text
          </button>
        </div>
      )}
    </div>
  );
}
