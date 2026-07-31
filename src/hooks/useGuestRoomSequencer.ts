import { useEffect, useState, useRef } from "react";

interface SequencerParams {
  isInterrupted: boolean;
}

export function useGuestRoomSequencer({ isInterrupted }: SequencerParams) {
  const [guestPlaceholder, setGuestPlaceholder] = useState("Total Guests");
  const [roomPlaceholder, setRoomPlaceholder] = useState("Total Rooms");

  const [guestState, setGuestState] = useState<"active" | "frozen" | "fade-out">("active");
  const [roomState, setRoomState] = useState<"active" | "frozen" | "fade-out">("frozen");

  const activeSectionRef = useRef<"guests" | "rooms">("guests");
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const clearAllTimers = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  const safeTimeout = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  };

  const animateCounter = (
    start: number,
    end: number,
    duration: number,
    onUpdate: (val: string) => void,
    onComplete: () => void
  ) => {
    let startTime: number | null = null;
    const step = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const val = Math.floor(progress * (end - start) + start);
      onUpdate(val.toString());

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        onComplete();
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (isInterrupted) {
      clearAllTimers();
      setGuestPlaceholder("Total Guests");
      setRoomPlaceholder("Total Rooms");
      setGuestState("active");
      setRoomState("active");
      return;
    }

    const runSequence = () => {
      clearAllTimers();

      if (activeSectionRef.current === "guests") {
        setGuestState("active");
        setRoomState("frozen");

        safeTimeout(() => {
          setGuestState("fade-out");

          safeTimeout(() => {
            setGuestState("active");
            animateCounter(1, 300, 1500, setGuestPlaceholder, () => {
              safeTimeout(() => {
                setGuestState("fade-out");

                safeTimeout(() => {
                  setGuestPlaceholder("Total Guests");
                  setGuestState("active");

                  safeTimeout(() => {
                    activeSectionRef.current = "rooms";
                    runSequence();
                  }, 1000);
                }, 300);
              }, 1000);
            });
          }, 300);
        }, 3000);
      } else {
        setRoomState("active");
        setGuestState("frozen");

        safeTimeout(() => {
          setRoomState("fade-out");

          safeTimeout(() => {
            setRoomState("active");
            animateCounter(1, 100, 1500, setRoomPlaceholder, () => {
              safeTimeout(() => {
                setRoomState("fade-out");

                safeTimeout(() => {
                  setRoomPlaceholder("Total Rooms");
                  setRoomState("active");

                  safeTimeout(() => {
                    activeSectionRef.current = "guests";
                    runSequence();
                  }, 1000);
                }, 300);
              }, 1000);
            });
          }, 300);
        }, 3000);
      }
    };

    runSequence();

    return () => clearAllTimers();
  }, [isInterrupted]);

  return {
    guestPlaceholder,
    roomPlaceholder,
    guestState,
    roomState,
  };
}