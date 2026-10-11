"use client";
import { useRef, useState } from "react";
import TourArrow from "./TourArrow";
import TourIcon from "./TourIcon";
export default function TerraceTour({
  available,
  onActive,
}: {
  available: boolean;
  onActive: (active: boolean) => void;
}) {
  const [state, setState] = useState<
    "idle" | "loading" | "outbound" | "terrace" | "returning"
  >("idle");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reverseVisible, setReverseVisible] = useState(false);
  const forward = useRef<HTMLVideoElement>(null),
    reverse = useRef<HTMLVideoElement>(null);
  const lock = useRef(false);
  const reduced = useRef(false);
  const active = state !== "idle";
  async function enter() {
    if (lock.current || !available) return;
    lock.current = true;
    setError("");
    setReverseVisible(false);
    onActive(true);
    reduced.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced.current) {
      setState("terrace");
      lock.current = false;
      return;
    }
    setState("loading");
    try {
      const p = forward.current!;
      p.currentTime = 0;
      await p.play();
      setState("outbound");
    } catch {
      setState("idle");
      onActive(false);
      setError("Video başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      lock.current = false;
    }
  }
  async function back() {
    if (lock.current || state === "returning") return;
    lock.current = true;
    setBusy(true);
    setError("");
    forward.current?.pause();
    if (reduced.current) {
      finish();
      return;
    }
    try {
      const p = reverse.current!;
      if (p.readyState < 1)
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            clean();
            reject(new Error("Timeout"));
          }, 15000);
          const ready = () => {
              clean();
              resolve();
            },
            fail = () => {
              clean();
              reject(new Error("Load error"));
            };
          function clean() {
            clearTimeout(timer);
            p.removeEventListener("loadedmetadata", ready);
            p.removeEventListener("error", fail);
          }
          p.addEventListener("loadedmetadata", ready);
          p.addEventListener("error", fail);
          p.load();
        });
      const offset = Math.max(
        0,
        Math.min(
          p.duration - 0.05,
          p.duration - (forward.current?.currentTime ?? 0),
        ),
      );
      if (Math.abs(p.currentTime - offset) > 0.01)
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            clean();
            reject(new Error("Seek timeout"));
          }, 10000);
          const ready = () => {
            clean();
            resolve();
          };
          function clean() {
            clearTimeout(timer);
            p.removeEventListener("seeked", ready);
          }
          p.addEventListener("seeked", ready);
          p.currentTime = offset;
        });
      await p.play();
      setReverseVisible(true);
      setState("returning");
    } catch {
      setError("Dönüş videosu yüklenemedi. Tekrar deneyin.");
      lock.current = false;
      setBusy(false);
    }
  }
  function finish() {
    forward.current?.pause();
    reverse.current?.pause();
    setState("idle");
    setReverseVisible(false);
    setBusy(false);
    lock.current = false;
    onActive(false);
  }
  return (
    <>
      {available && !active && (
        <div className="terrace-invitation">
          <button className="home-route home-terrace-route" onClick={enter}>
            <TourIcon terrace />
            <span>Dış mekânı keşfet</span>
            <TourArrow left />
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      )}
      <section
        className={`terrace-tour ${active ? "terrace-active" : ""}`}
        aria-hidden={!active}
        aria-label="Kafe terası"
        aria-busy={state === "loading" || busy}
      >
        <video
          ref={forward}
          className="scene terrace-media"
          src="/entrance-to-terrace.mp4"
          poster="/entrance.webp"
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          onEnded={() => setState((s) => (s === "outbound" ? "terrace" : s))}
          onError={() => {
            if (active)
              setError("Video yüklenemedi. Girişe dönüp tekrar deneyin.");
          }}
        />
        <img
          className={`scene terrace-media ${state === "terrace" && !busy ? "" : "terrace-hidden"}`}
          src="/terrace.webp"
          alt="Zeytin Kafe’nin ağaçlar ve masalarla çevrili açık hava terası"
          loading="eager"
        />
        <video
          ref={reverse}
          className={`scene terrace-media ${reverseVisible ? "" : "terrace-hidden"}`}
          src="/terrace-to-entrance.mp4"
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          onEnded={finish}
        />
        <div className="shade shade-tour absolute inset-0" />
        <header className="topbar absolute inset-x-0 top-0 z-10 flex items-center justify-between">
          <button
            className="brand terrace-brand"
            onClick={back}
            disabled={busy || state === "loading"}
            aria-label="Zeytin Kafe, girişe dön"
          >
            <span className="brand-mark" aria-hidden="true">
              ✳
            </span>
            <span>
              zeytin<small>KAHVE & PASTANE</small>
            </span>
          </button>
          <button
            className="back-button"
            onClick={back}
            disabled={busy || state === "loading"}
          >
            {busy ? "Geri dönülüyor…" : "← Girişe dön"}
          </button>
        </header>
        {state === "loading" && (
          <div className="loading-state" role="status">
            <span className="spinner" />
            Teras hazırlanıyor…
          </div>
        )}
        {state === "terrace" && !busy && (
          <div className="terrace-caption">
            <p className="eyebrow">Zeytin’in açık hava köşesi</p>
            <h2>
              Biraz temiz hava.
              <br />
              Bir fincan huzur.
            </h2>
            <button className="back-button" onClick={back}>
              ← Kafeye dön
            </button>
          </div>
        )}
        {error && active && (
          <p className="terrace-error" role="alert">
            {error}
          </p>
        )}
        <footer className="bottom-bar absolute inset-x-0 bottom-0 z-10 flex items-center justify-between">
          <span className="footer-word">SAKİN ANLAR. GÜZEL KAHVE.</span>
          <span className="scene-number">
            {state === "returning" ? "Girişe dönüş" : "Açık hava terası"}
          </span>
        </footer>
      </section>
    </>
  );
}
