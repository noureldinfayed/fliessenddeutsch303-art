import { TextbookInventoryManager } from "@/components/forms/textbook-inventory-manager";
import { getCurrentUser } from "@/lib/auth";

export default async function TextbookInventoryPage() {
  const { supabase } = await getCurrentUser("admin");
  const { data } = await supabase.from("textbook_inventory").select("*").order("title");
  return <TextbookInventoryManager initialBooks={data ?? []} />;
}
