import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Three demo accounts. Same password for all so reviewers can log in quickly.
// This is intentional for the assessment — see ARCHITECTURE.md ("Auth") for the
// tradeoffs and what a production version would do instead.
const DEMO_PASSWORD = "password123";

const USERS = [
  { email: "alice@ajaia.dev", name: "Alice Rivera" },
  { email: "bob@ajaia.dev", name: "Bob Chen" },
  { email: "carol@ajaia.dev", name: "Carol Diaz" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name },
        create: { email: u.email, name: u.name, password: passwordHash },
      })
    )
  );

  const [alice, bob] = users;

  // Only seed sample documents once (when Alice has none) so re-running seed
  // is idempotent and doesn't pile up duplicates.
  const existing = await prisma.document.count({ where: { ownerId: alice.id } });
  if (existing === 0) {
    const welcome = await prisma.document.create({
      data: {
        title: "Welcome to Ajaia Docs",
        ownerId: alice.id,
        content: `
          <h1>Welcome to Ajaia Docs</h1>
          <p>This is a lightweight collaborative editor. Try the toolbar above to make text
          <strong>bold</strong>, <em>italic</em>, or <u>underlined</u>.</p>
          <h2>Things you can do</h2>
          <ul>
            <li>Create, rename, and edit documents</li>
            <li>Import a <code>.txt</code>, <code>.md</code>, or <code>.docx</code> file into a new doc</li>
            <li>Share a document with a teammate as a viewer or editor</li>
          </ul>
          <p>Edits autosave a moment after you stop typing.</p>
        `.trim(),
      },
    });

    // Alice shares the welcome doc with Bob as an editor to demonstrate sharing.
    await prisma.share.create({
      data: { documentId: welcome.id, userId: bob.id, role: "editor" },
    });

    await prisma.document.create({
      data: {
        title: "Q3 Planning Notes",
        ownerId: alice.id,
        content: `<h2>Q3 Planning Notes</h2><p>Draft agenda:</p><ol><li>Review Q2 outcomes</li><li>Set Q3 priorities</li><li>Assign owners</li></ol>`,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Demo accounts (password for all: %s):", DEMO_PASSWORD);
  USERS.forEach((u) => console.log(`  - ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
