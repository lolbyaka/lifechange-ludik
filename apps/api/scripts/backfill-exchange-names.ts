/**
 * One-time script: set Exchange.name = type for records where name is null.
 * Run from apps/api: pnpm exec ts-node -r tsconfig-paths/register scripts/backfill-exchange-names.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const exchanges = await prisma.exchange.findMany({
    where: { name: null },
  });
  for (const ex of exchanges) {
    await prisma.exchange.update({
      where: { id: ex.id },
      data: { name: ex.type },
    });
    console.log(`Updated exchange ${ex.id}: name = ${ex.type}`);
  }
  console.log(`Done. Updated ${exchanges.length} exchange(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
