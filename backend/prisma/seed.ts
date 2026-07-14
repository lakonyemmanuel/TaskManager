import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma.js";

const seed = async () => {
  const adminEmail = "admin@taskmanager.local";
  const adminPassword = await bcrypt.hash("ChangeMe123!", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      firstname: "Admin",
      lastName: "User",
      email: adminEmail,
      password: adminPassword,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: "seed-workspace" },
    update: {},
    create: {
      id: "seed-workspace",
      name: "Getting Started",
      description: "Seeded workspace for local development",
      members: {
        create: [{ userId: adminUser.id, role: "OWNER" }],
      },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Set up project environment",
        description: "Configure .env and run migrations",
        workspaceId: workspace.id,
      },
      {
        title: "Review production checklist",
        description: "Verify security, monitoring and backups",
        workspaceId: workspace.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete");
};

seed()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
