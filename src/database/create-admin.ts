import 'dotenv/config';
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@agri.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin123!';
const AGENT_EMAIL = process.env.AGENT_EMAIL ?? 'agent@agri.local';
const AGENT_PASSWORD = process.env.AGENT_PASSWORD ?? 'Agent123!';
const PRODUCTEUR_EMAIL = process.env.PRODUCTEUR_EMAIL ?? 'producteur@agri.local';
const PRODUCTEUR_PASSWORD = process.env.PRODUCTEUR_PASSWORD ?? 'Producteur123!';
const ACHETEUR_EMAIL = process.env.ACHETEUR_EMAIL ?? 'acheteur@agri.local';
const ACHETEUR_PASSWORD = process.env.ACHETEUR_PASSWORD ?? 'Acheteur123!';

async function main() {
  // Mêmes règles que src/database/typeorm.config.ts : DATABASE_URL prioritaire
  // (Railway), sinon variables séparées (local).
  const databaseUrl = process.env.DATABASE_URL;
  const client = databaseUrl
    ? new Client({
        connectionString: databaseUrl,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      })
    : new Client({
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5433),
        user: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? '1234',
        database: process.env.DB_NAME ?? 'Agri_db',
      });

  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await client.query(
      `INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
       VALUES (gen_random_uuid(), $1, $2, 'Admin', 'Agri', 'ADMIN', true)
       ON CONFLICT (email) DO UPDATE
         SET "passwordHash" = EXCLUDED."passwordHash",
             role = 'ADMIN',
             active = true,
             "updatedAt" = now()`,
      [ADMIN_EMAIL, passwordHash],
    );

    const agentHash = await bcrypt.hash(AGENT_PASSWORD, 10);

    const { rows } = await client.query(
      `INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
       VALUES (gen_random_uuid(), $1, $2, 'Terrain', 'Agent', 'AGENT', true)
       ON CONFLICT (email) DO UPDATE
         SET "passwordHash" = EXCLUDED."passwordHash",
             role = 'AGENT',
             active = true,
             "updatedAt" = now()
       RETURNING id`,
      [AGENT_EMAIL, agentHash],
    );

    await client.query(
      `INSERT INTO agents (id, "utilisateurId", "numeroIdentifiant", zone)
       VALUES (gen_random_uuid(), $1, 'AGT-0001', 'Zone par défaut')
       ON CONFLICT ("utilisateurId") DO NOTHING`,
      [rows[0].id],
    );

    const producteurHash = await bcrypt.hash(PRODUCTEUR_PASSWORD, 10);

    const { rows: prodRows } = await client.query(
      `INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
       VALUES (gen_random_uuid(), $1, $2, 'Test', 'Producteur', 'PRODUCTEUR', true)
       ON CONFLICT (email) DO UPDATE
         SET "passwordHash" = EXCLUDED."passwordHash",
             role = 'PRODUCTEUR',
             active = true,
             "updatedAt" = now()
       RETURNING id`,
      [PRODUCTEUR_EMAIL, producteurHash],
    );

    // Producteur.id = id de l'utilisateur (convention de l'app)
    await client.query(
      `INSERT INTO producteurs (id, "userId", address, city, region, pays, "yearsOfExperience")
       VALUES ($1, $2, 'Adresse de test', 'Lomé', 'Maritime', 'Togo', 5)
       ON CONFLICT ("userId") DO NOTHING`,
      [prodRows[0].id, prodRows[0].id],
    );

    const acheteurHash = await bcrypt.hash(ACHETEUR_PASSWORD, 10);

    const { rows: achRows } = await client.query(
      `INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
       VALUES (gen_random_uuid(), $1, $2, 'Test', 'Acheteur', 'ACHETEUR', true)
       ON CONFLICT (email) DO UPDATE
         SET "passwordHash" = EXCLUDED."passwordHash",
             role = 'ACHETEUR',
             active = true,
             "updatedAt" = now()
       RETURNING id`,
      [ACHETEUR_EMAIL, acheteurHash],
    );

    // Acheteur.id = id de l'utilisateur (convention de l'app)
    await client.query(
      `INSERT INTO acheteurs (id, "utilisateurId", "typeSociete", "nomSociete", region, pays, telephone, email)
       VALUES ($1, $2, 'Particulier', 'Acheteur Test', 'Maritime', 'Togo', null, $3)
       ON CONFLICT ("utilisateurId") DO NOTHING`,
      [achRows[0].id, achRows[0].id, ACHETEUR_EMAIL],
    );

    console.log('Comptes créés ou mis à jour.');
    console.log(`  PRODUCTEUR -> ${PRODUCTEUR_EMAIL} / ${PRODUCTEUR_PASSWORD}`);
    console.log(`  ACHETEUR -> ${ACHETEUR_EMAIL} / ${ACHETEUR_PASSWORD}`);
    console.log(`  ADMIN -> ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  AGENT -> ${AGENT_EMAIL} / ${AGENT_PASSWORD}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Échec :', err.message);
  process.exit(1);
});
