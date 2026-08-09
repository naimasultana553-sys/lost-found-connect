import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const hash = await bcrypt.hash("demo1234", 10);
    await prisma.user.create({
      data: {
        name: "Demo User",
        email,
        passwordHash: hash,
      },
    });
    console.log("Created demo user:", email, "(password: demo1234)");
  } else {
    console.log("Demo user already exists:", email);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
