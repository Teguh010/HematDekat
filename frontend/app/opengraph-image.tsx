/* eslint-disable i18next/no-literal-string */

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 80,
          background: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: 48,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 32,
            background: "rgba(15,23,42,0.72)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "linear-gradient(135deg, #34d399 0%, #0f766e 100%)",
                color: "#020617",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              H
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 24, letterSpacing: 8, color: "#a7f3d0", textTransform: "uppercase" }}>
                HematDekat
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05 }}>
              Cari sembako termurah
            </div>
            <div style={{ fontSize: 34, color: "#cbd5e1", lineHeight: 1.3 }}>
              di dekatmu, dengan data dari pasar, toko, dan komunitas.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, color: "#e2e8f0" }}>
            <span>Bandingkan harga</span>
            <span>Konfirmasi harga</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
