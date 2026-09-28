"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = { href: string; label: string };

export function PersistentNavGroup({ groupKey, label, items, rtl = false, mobile = false }: { groupKey: string; label: string; items: Item[]; rtl?: boolean; mobile?: boolean }) {
  const storageKey = `fd_sidebar_group_${groupKey}`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) setOpen(saved === "true");
  }, [storageKey]);

  function toggle() {
    setOpen((current) => {
      const next = !current;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return <details open={open} className="group">
    <summary onClick={(event) => { event.preventDefault(); toggle(); }} className={`cursor-pointer list-none ${mobile ? "rounded-md px-3 py-2 text-[11px] font-bold uppercase" : "px-3 py-1 text-[11px] font-bold uppercase tracking-wide"} text-muted-foreground after:float-right after:content-['+'] group-open:after:content-['−']`}>{label}</summary>
    <div className="mt-1 grid gap-1">{items.map((item) => <Link key={item.href} className={`${mobile ? "rounded-md px-3 py-2 text-sm hover:bg-muted" : "rounded-md border-transparent px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:border-brand-red hover:bg-muted"} ${rtl && !mobile ? "border-r-2 text-right" : !mobile ? "border-l-2 text-left" : ""}`} href={item.href}>{item.label}</Link>)}</div>
  </details>;
}
