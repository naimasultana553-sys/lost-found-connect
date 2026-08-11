import { getCurrentUser } from "@/lib/auth";
import { BottomNavClient } from "@/components/BottomNavClient";

export async function BottomNav() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <BottomNavClient />;
}
