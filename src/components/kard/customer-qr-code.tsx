"use client";

import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

interface CustomerQRCodeProps {
  /**
   * Raw string encoded in the QR code. Comes from
   * `getCustomerQrToken()` — today a mock `kard://customer/...` value.
   */
  value: string;
  customerName: string;
  memberId: string;
  className?: string;
}

/**
 * The customer's scannable code. Always rendered on a solid white panel so it
 * stays readable on dark themes and low-brightness screens.
 */
export function CustomerQRCode({
  value,
  customerName,
  memberId,
  className,
}: CustomerQRCodeProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-white p-6 text-center shadow-sm",
        className,
      )}
    >
      <p className="text-[11px] font-semibold tracking-[0.28em] text-neutral-500">
        SCAN TO EARN
      </p>

      <div className="mt-5 flex justify-center">
        <div className="rounded-2xl bg-white p-3">
          <QRCodeSVG
            value={value}
            size={232}
            level="M"
            marginSize={0}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
            title={`Kard code for ${customerName}`}
          />
        </div>
      </div>

      <p className="mt-5 text-lg font-semibold tracking-tight text-neutral-900">
        {customerName}
      </p>
      <p className="mt-1 font-mono text-xs tracking-tight text-neutral-500">{memberId}</p>
    </div>
  );
}
