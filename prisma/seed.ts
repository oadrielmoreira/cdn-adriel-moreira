import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.APP_USER ?? "adrielmoreira";
  const password = process.env.APP_PASSWORD ?? "cdn@2030";

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Usuário admin já existe, seed ignorado.");
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name: "Adriel",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin criado: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
