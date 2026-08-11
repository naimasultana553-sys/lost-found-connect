const { PrismaClient } = require("@prisma/client");
const c = new PrismaClient();
(async () => {
  try {
    const count = await c.user.count();
    console.log("CONNECTION OK. users in DB:", count);
  } catch (e) {
    console.log("FAILED:", e.message.split("\n")[0]);
  } finally {
    await c.$disconnect();
  }
})();
