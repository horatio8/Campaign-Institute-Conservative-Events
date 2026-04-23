"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function Qr({ value, size = 240 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      width: size,
      margin: 1,
      color: { dark: "#0d0f14", light: "#ffffff" },
    }).then(setSrc);
  }, [value, size]);
  if (!src) {
    return <div className="bg-ink-800 rounded" style={{ width: size, height: size }} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="QR code" width={size} height={size} className="rounded bg-white p-2" />;
}
