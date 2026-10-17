"use client";

import { useEffect, useState } from "react";
import Grainient from "./Grainient";

export function Background() {
  const [mounted, setMounted] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(q.matches);
    update();
    setMounted(true);
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);

  // The .bg gradient renders on the server and stays underneath as the fallback.
  return (
    <div className="bg" aria-hidden="true">
      {mounted && <Grainient className="bg-grain" {...(still && { timeSpeed: 0, warpSpeed: 0 })} />}
    </div>
  );
}
