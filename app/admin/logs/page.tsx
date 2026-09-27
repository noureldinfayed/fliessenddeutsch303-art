import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminLogsPage() {
  const { supabase } = await getCurrentUser("admin");
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false });
  return <Card><CardHeader><CardTitle>Activity logs</CardTitle></CardHeader><CardContent className="p-0"><div className="max-h-[75vh] overflow-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="sticky top-0 z-10 bg-muted"><tr>{["Worker", "Email", "Action", "Type", "Record", "Details", "Date", "Time"].map((header) => <th key={header} className="px-4 py-3 text-left font-semibold">{header}</th>)}</tr></thead><tbody>{(data ?? []).map((log) => { const date = new Date(log.created_at); return <tr key={log.id} className="border-t"><td className="px-4 py-3 font-semibold">{log.actor_name}</td><td className="px-4 py-3">{log.actor_email}</td><td className="px-4 py-3">{log.action}</td><td className="px-4 py-3">{log.entity_type}</td><td className="px-4 py-3">{log.entity_id}</td><td className="max-w-[360px] whitespace-pre-wrap px-4 py-3">{JSON.stringify(log.details)}</td><td className="px-4 py-3">{date.toLocaleDateString()}</td><td className="px-4 py-3">{date.toLocaleTimeString()}</td></tr>; })}</tbody></table>{!(data ?? []).length && <p className="p-8 text-center text-muted-foreground">No activity logs yet.</p>}</div></CardContent></Card>;
}
