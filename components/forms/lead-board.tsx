"use client";

import { useState } from "react";
import { MessageCircle, Phone, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toWhatsApp } from "@/lib/utils";

type Interaction = { id: string; note: string; created_at: string; users?: { full_name: string } | null };
type Lead = { id: string; full_name: string; phone: string; status: string; created_at: string; converted_to_student_id?: string | null; lead_interactions?: Interaction[] };

export function LeadBoard({ initialLeads, currentUserId }: { initialLeads: Lead[]; currentUserId: string }) {
  const [leads, setLeads] = useState(initialLeads);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const supabase = createSupabaseBrowserClient();
  async function setStatus(id: string, status: string) {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads((value) => value.map((lead) => lead.id === id ? { ...lead, status } : lead));
  }
  async function addNote(id: string) {
    const note = notes[id];
    if (!note) return;
    await supabase.from("lead_interactions").insert({ lead_id: id, note, created_by: currentUserId });
    setNotes((value) => ({ ...value, [id]: "" }));
  }
  async function convert(lead: Lead) {
    const { data } = await supabase.from("students").insert({ full_name: lead.full_name, phone: lead.phone, status: "active", enrolled_at: new Date().toISOString() }).select("id").single();
    if (data) {
      await supabase.from("leads").update({ converted_to_student_id: data.id, status: "booked" }).eq("id", lead.id);
      setLeads((value) => value.map((item) => item.id === lead.id ? { ...item, converted_to_student_id: data.id, status: "booked" } : item));
    }
  }
  return (
    <div className="grid gap-4">
      {leads.map((lead) => {
        const last = lead.lead_interactions?.[0]?.created_at;
        const days = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : null;
        return (
          <Card key={lead.id}>
            <CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>{lead.full_name}</CardTitle><p className="text-sm text-muted-foreground">{lead.phone} · {days === null ? "No contact yet" : `${days} days since last contact`}</p></div><Badge>{lead.status}</Badge></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Select className="max-w-52" value={lead.status} disabled={Boolean(lead.converted_to_student_id)} onChange={(e) => setStatus(lead.id, e.target.value)}>{["new", "interested", "thinking", "no_answer", "booked", "not_interested"].map((s) => <option key={s} value={s}>{s}</option>)}</Select>
                <Button asChild variant="outline"><a href={toWhatsApp(lead.phone)} target="_blank"><MessageCircle size={16} /> WhatsApp</a></Button>
                <Button asChild variant="outline"><a href={`tel:${lead.phone}`}><Phone size={16} /> Call</a></Button>
                {lead.status === "booked" && !lead.converted_to_student_id && <Button onClick={() => convert(lead)}><UserPlus size={16} /> Convert to Student</Button>}
              </div>
              <div className="space-y-2">{lead.lead_interactions?.map((interaction) => <div key={interaction.id} className="rounded-md bg-muted p-3 text-sm"><p>{interaction.note}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(interaction.created_at).toLocaleString()} · {interaction.users?.full_name}</p></div>)}</div>
              <div className="grid gap-2 md:grid-cols-[1fr_auto]"><Textarea value={notes[lead.id] ?? ""} onChange={(e) => setNotes((value) => ({ ...value, [lead.id]: e.target.value }))} placeholder="Add immutable note..." /><Button onClick={() => addNote(lead.id)}>Add Note</Button></div>
            </CardContent>
          </Card>
        );
      })}
      {!leads.length && <Card><CardContent className="p-8 text-center text-muted-foreground">No assigned leads yet.</CardContent></Card>}
    </div>
  );
}
