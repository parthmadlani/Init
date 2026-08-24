"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

// Moment in intro-video.mp4 where the mock "Welcome back" card has fully
// faded in but is still empty/unfocused — the same resting state as the
// real form below, so the crossfade reads as a continuation, not a cut.
const SWAP_TIME = 18.2;
const FADE_MS = 500;

const BACKGROUND =
  "radial-gradient(ellipse 700px 550px at 45% 15%, rgba(255,214,234,0.6), transparent 70%), " +
  "radial-gradient(ellipse 700px 600px at 78% 70%, rgba(207,243,247,0.6), transparent 70%), " +
  "#FBFAF7";

export function LoginIntro() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [videoUnavailable, setVideoUnavailable] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function reveal() {
      setShowForm(true);
    }

    function onTimeUpdate() {
      if (video!.currentTime >= SWAP_TIME) reveal();
    }

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", reveal);
    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", reveal);
    };
  }, []);

  const revealed = showForm || videoUnavailable;

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
      style={{ background: BACKGROUND }}
    >
      {!videoUnavailable && (
        <video
          ref={videoRef}
          src="/intro-video.mp4"
          autoPlay
          muted
          playsInline
          onError={() => setVideoUnavailable(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover ease-out"
          style={{
            transition: `opacity ${FADE_MS}ms ease-out`,
            opacity: showForm ? 0 : 1,
          }}
        />
      )}

      <div
        className="w-full max-w-[420px] rounded-card border border-black/10 bg-white p-8 shadow-xl ease-out"
        style={{ transition: `opacity ${FADE_MS}ms ease-out`, opacity: revealed ? 1 : 0 }}
      >
        <h1 className="mb-1 font-serif text-display font-bold text-brand-dark">Welcome back</h1>
        <p className="mb-8 text-sm text-black/60">Sign in to continue your paths.</p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-black/60">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-brand-pink">
            Create one
          </Link>
        </p>
      </div>

      {!revealed && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="absolute bottom-6 right-6 text-xs font-semibold text-black/50 transition-colors hover:text-black/80"
        >
          Skip
        </button>
      )}
    </main>
  );
}
