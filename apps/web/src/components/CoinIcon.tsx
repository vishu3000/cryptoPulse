import { type Coin } from "@/lib/staticData";

export default function CoinIcon({ coin, size = 32 }: { coin: Coin; size?: number }) {
  const isGradient = coin.id === "solana";
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: isGradient
          ? "linear-gradient(135deg,#9945FF 0%,#14F195 100%)"
          : coin.color,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06)`,
      }}
    >
      {coin.symbol[0]}
    </div>
  );
}
