import { useEffect, useRef } from "react";
import type { QueueEvent } from "@shared/api";

export function useSSE(url: string, onEvent: (ev: QueueEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const es = new EventSource(url);
    const types: QueueEvent["type"][] = [
      "init",
      "window.updated",
      "ticket.created",
      "ticket.updated",
      "display.updated",
    ];

    const listeners = types.map((t) => {
      const fn = (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          handlerRef.current({ type: t, payload } as QueueEvent);
        } catch {
          // ignore
        }
      };
      es.addEventListener(t, fn);
      return () => es.removeEventListener(t, fn);
    });

    return () => {
      listeners.forEach((off) => off());
      es.close();
    };
  }, [url]);
}
