import { useState, useRef, useCallback } from "react";
import { Image as ImageIcon } from "lucide-react";

const TESSERACT_CDN = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js";

let tesseractLoaded = false;

async function loadTesseract() {
  if (tesseractLoaded || window.Tesseract) { tesseractLoaded = true; return; }
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TESSERACT_CDN;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  tesseractLoaded = true;
}

// Pre-process image for better OCR accuracy
async function preprocessImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 2400; // max dimension for OCR quality
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");

      // Draw with contrast boost for paper documents
      ctx.filter = "contrast(1.4) brightness(1.1) grayscale(1)";
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, "image/png");
    };
    img.src = url;
  });
}

async function runOCR(file, onProgress) {
  await loadTesseract();

  const processedBlob = await preprocessImage(file);

  const worker = await window.Tesseract.createWorker(
    ["eng", "hin"], // English + Hindi support
    1,
    {
      workerPath: "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core-simd-lstm.wasm.js",
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress(Math.round(m.progress * 100));
        }
      },
    }
  );

  const { data } = await worker.recognize(processedBlob);
  await worker.terminate();

  return data.text;
}

// Clean up OCR output — remove garbage characters common in document scans
function cleanOCRText(raw) {
  return raw
    .replace(/[|}{\\]/g, "") // common OCR artifacts
    .replace(/\f/g, "\n")    // form feeds → newlines
    .replace(/\n{4,}/g, "\n\n\n") // collapse excessive blank lines
    .replace(/[ \t]{3,}/g, "  ")  // collapse excessive spaces
    .trim();
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export default function ImageOCR({ onTextExtracted, disabled }) {
  const [status, setStatus] = useState("idle"); // idle|loading|done|error
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef();

  const processImage = useCallback(async (file) => {
    if (!file) return;
    setFileName(file.name || "photo.jpg");
    setStatus("loading");
    setProgress(0);
    setErrorMsg("");

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      const rawText = await runOCR(file, setProgress);
      const cleaned = cleanOCRText(rawText);

      if (!cleaned || cleaned.length < 30) {
        throw new Error("Could not read text from this image. Try better lighting or a clearer photo.");
      }

      setStatus("done");
      onTextExtracted(cleaned, file.name || "scanned_contract");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "OCR failed. Please try a clearer image.");
      URL.revokeObjectURL(previewUrl);
      setPreview(null);
    }
  }, [onTextExtracted]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  return (
    <div style={{ marginBottom: 12 }}>

      {/* Action buttons row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {/* Upload image */}
        <button
          onClick={() => !disabled && fileRef.current?.click()}
          disabled={disabled || status === "loading"}
          style={{
            flex: 1,
            padding: "10px 0",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderRadius: 8,
            cursor: disabled ? "not-allowed" : "pointer",
            background: "var(--surface)",
            border: "1px dashed var(--border)",
            color: "var(--text)",
          }}
        >
          <ImageIcon size={14} /> Upload photo
        </button>

        <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} style={{ display: "none" }} onChange={onFileChange} />
      </div>

      {/* Supported formats note */}
      {status === "idle" && (
        <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
          JPG · PNG · WEBP · HEIC &nbsp;·&nbsp; Works with printed, handwritten & photographed contracts &nbsp;·&nbsp; Hindi + English
        </p>
      )}

      {/* Progress bar */}
      {status === "loading" && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {progress < 10 ? "Loading OCR engine…" : progress < 90 ? "Reading text from image…" : "Finalising…"}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{progress}%</span>
          </div>
          <div style={{ height: 5, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: 3, transition: "width 0.3s" }} />
          </div>
          {preview && (
            <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 6, marginTop: 8, opacity: 0.7 }} />
          )}
        </div>
      )}

      {/* Success state */}
      {status === "done" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
          background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 8, marginTop: 4,
        }}>
          {preview && <img src={preview} alt="preview" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 5 }} />}
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--success)" }}>✓ Text extracted from image</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>{fileName} · click "Upload photo" to swap</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div style={{
          padding: "8px 12px", background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, marginTop: 4,
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--danger)" }}>✗ {errorMsg}</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>
            Tips: use good lighting, hold camera steady, ensure text fills the frame
          </p>
        </div>
      )}
    </div>
  );
}
