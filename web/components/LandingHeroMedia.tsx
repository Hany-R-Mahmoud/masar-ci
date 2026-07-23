"use client";

import { useEffect, useState } from "react";
import { WebGLFlowHero } from "@/components/WebGLFlowHero";

const VIDEO_URL = "https://ik.imagekit.io/hrim/images/masar-video.mp4";

export function LandingHeroMedia() {
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (videoFailed || reducedMotion !== false) return <WebGLFlowHero />;

  return (
    <div className="flow-hero-stage" role="img" aria-label="Animated workflow video showing the MasarCI sample pipeline">
      <video
        className="landing-hero-video"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        onError={() => setVideoFailed(true)}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="flow-stage-status">● trigger → build → deploy</div>
      <div className="flow-label flow-label-trigger"><b>on: push</b><small>branches: [main]</small></div>
      <div className="flow-label flow-label-build"><b>build</b><small>ubuntu-latest · 3 steps</small></div>
      <div className="flow-label flow-label-deploy"><b>deploy</b><small>needs: [build] · <em>finding</em></small></div>
      <div className="flow-stage-caption">the whole path, in one frame.</div>
    </div>
  );
}
