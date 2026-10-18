"use client";

import { useEffect, useState, useRef, useCallback } from "react";

export type ConnectionState = "LIVE" | "RECONNECTING" | "POLLING" | "OFFLINE";

interface UseAdminRealtimeOptions {
  pollingIntervalMs?: number;
  onUpdate?: () => void;
  streamUrl?: string;
}

export function useAdminRealtime(options: UseAdminRealtimeOptions = {}) {
  const {
    pollingIntervalMs = 12000,
    onUpdate,
    streamUrl = "/api/admin/stream",
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>("RECONNECTING");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [streamData, setStreamData] = useState<Record<string, unknown> | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const triggerUpdate = useCallback(() => {
    setLastUpdated(new Date());
    if (onUpdateRef.current) {
      onUpdateRef.current();
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    setConnectionState("POLLING");

    pollingTimerRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        triggerUpdate();
      }
    }, pollingIntervalMs);
  }, [pollingIntervalMs, triggerUpdate]);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let unmounted = false;
    let retryTimeout: NodeJS.Timeout | null = null;

    function connect() {
      if (typeof window === "undefined" || unmounted) return;

      try {
        const es = new EventSource(streamUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (unmounted) return;
          stopPolling();
          setConnectionState("LIVE");
          setLastUpdated(new Date());
        };

        es.addEventListener("snapshot", (e: MessageEvent) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(e.data);
            setStreamData(data);
            setLastUpdated(new Date());
            if (onUpdateRef.current) onUpdateRef.current();
          } catch {}
        });

        es.addEventListener("operations:updated", (e: MessageEvent) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(e.data);
            setStreamData(data);
            setLastUpdated(new Date());
            if (onUpdateRef.current) onUpdateRef.current();
          } catch {}
        });

        es.onerror = () => {
          if (unmounted) return;
          es.close();
          eventSourceRef.current = null;
          setConnectionState("RECONNECTING");
          startPolling();

          retryTimeout = setTimeout(() => {
            if (!unmounted) {
              connect();
            }
          }, 15000);
        };
      } catch {
        if (!unmounted) {
          startPolling();
        }
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeout) clearTimeout(retryTimeout);
      stopPolling();
    };
  }, [streamUrl, startPolling, stopPolling]);

  return {
    connectionState,
    status: connectionState,
    lastUpdated,
    streamData,
    triggerRefresh: triggerUpdate,
    refresh: triggerUpdate,
  };
}

