import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NavbarClient } from "@/components/NavbarClient";

export async function Navbar() {
  const user = await getCurrentUser();
  let unreadCount = 0;

  if (user) {
    unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });
  }

  return (
    <NavbarClient
      user={user ? { name: user.name, email: user.email } : null}
      unreadCount={unreadCount}
    />
  );
}
