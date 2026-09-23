"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

export function StudentAttendanceCell({ studentId }: { studentId: string }) {
  const [qr, setQr] = useState("");
  const [origin, setOrigin] = useState("");
  const url = useMemo(() => (origin ? `${origin}/attendance/student/${studentId}` : `/attendance/student/${studentId}`), [origin, studentId]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!origin) return;
    QRCode.toDataURL(url, { margin: 1, scale: 3, color: { dark: "#111111", light: "#FFFFFF" } }).then(setQr).catch(() => setQr(""));
  }, [origin, url]);

  return (
    <div className="flex min-w-40 items-center gap-2">
      {qr ? <Image src={qr} alt="Student attendance QR" width={54} height={54} unoptimized /> : <div className="h-[54px] w-[54px] rounded border bg-muted" />}
      <div className="grid gap-1">
        <Button asChild size="sm" variant="outline">
          <a href={url}>Check in</a>
        </Button>
        <button type="button" className="text-left text-xs text-muted-foreground hover:text-primary" onClick={() => navigator.clipboard.writeText(url)}>
          Copy link
        </button>
      </div>
    </div>
  );
}
