"use client";
import { useEffect, useRef, useState } from "react";

// Maps CoinCap asset id → live USD price
export type PriceMap = Record<string, number>;

const WS_BASE = "wss://ws.coincap.io/prices";
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

export function usePriceStream(coinIds: string[]): PriceMap {
  const [prices, setPrices] = useState<PriceMap>({});
  const ws = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(RECONNECT_BASE_MS);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    if (coinIds.length === 0) return;
    unmounted.current = false;

    function connect() {
      if (unmounted.current) return;
      const url = `${WS_BASE}?assets=${coinIds.join(",")}`;
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as Record<string, string>;
          setPrices((prev) => {
            const next = { ...prev };
            for (const [id, raw] of Object.entries(data)) {
              const price = parseFloat(raw);
              if (!isNaN(price)) next[id] = price;
            }
            return next;
          });
          reconnectDelay.current = RECONNECT_BASE_MS;
        } catch {
          // malformed frame — ignore
        }
      };

      socket.onclose = () => {
        if (unmounted.current) return;
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, RECONNECT_MAX_MS);
          connect();
        }, reconnectDelay.current);
      };

      socket.onerror = () => socket.close();
    }

    connect();

    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  // Re-connect only when the coin list changes identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinIds.join(",")]);

  return prices;
}
