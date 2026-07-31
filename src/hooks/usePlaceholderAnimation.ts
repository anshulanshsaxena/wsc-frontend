import { useEffect, useState } from "react";

export function usePlaceholderAnimation(placeholders: string[], intervalMs = 2500) {
  const [index, setIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"active" | "fade-out">("active");

  useEffect(() => {
    if (!placeholders || placeholders.length === 0) return;

    const interval = setInterval(() => {
      setFadeState("fade-out");
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % placeholders.length);
        setFadeState("active");
      }, 300);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [placeholders, intervalMs]);

  return { currentPlaceholder: placeholders[index] || "", fadeState };
}