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
          background: "#f8fafc",
          color: "#0f172a",
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
            border: "2px solid #e2e8f0",
            borderRadius: 24,
            background: "#ffffff",
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
                background: "#059669",
                color: "#ffffff",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              H
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: "#047857" }}>HematDekat</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05 }}>
              Cari sembako termurah
            </div>
            <div style={{ fontSize: 34, color: "#475569", lineHeight: 1.3 }}>
              di dekatmu, dengan data dari pasar, toko, dan komunitas.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28, color: "#334155" }}>
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
