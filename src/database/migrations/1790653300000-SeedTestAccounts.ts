import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crée les mêmes comptes de test que `npm run db:create-admin` (voir ce script
 * pour le détail), afin qu'ils existent aussi en production pour la vérification
 * initiale du déploiement. Idempotent (ON CONFLICT). Identifiants identiques à
 * ceux du dev local — à changer/retirer avant une mise en service réelle.
 */
export class SeedTestAccounts1790653300000 implements MigrationInterface {
  name = 'SeedTestAccounts1790653300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
      VALUES (gen_random_uuid(), 'admin@agri.local', '$2b$10$zkgerL1kKM5vbFoWjXoRiOQoPNmC4zrKOmYtatk192Amqx/213rN2', 'Admin', 'Agri', 'ADMIN', true)
      ON CONFLICT (email) DO NOTHING
    `);

    const agentResult = await queryRunner.query(`
      INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
      VALUES (gen_random_uuid(), 'agent@agri.local', '$2b$10$8AdoU6yg5ktzo1XldoaHJewiGktLfuz/JaXVelZm/5zNI0DkvhMxy', 'Terrain', 'Agent', 'AGENT', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `);
    if (agentResult.length) {
      await queryRunner.query(
        `INSERT INTO agents (id, "utilisateurId", "numeroIdentifiant", zone)
         VALUES (gen_random_uuid(), $1, 'AGT-0001', 'Zone par défaut')
         ON CONFLICT ("utilisateurId") DO NOTHING`,
        [agentResult[0].id],
      );
    }

    const prodResult = await queryRunner.query(`
      INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
      VALUES (gen_random_uuid(), 'producteur@agri.local', '$2b$10$wXsnAIGiPZlmxDzwIbFlf.0d7vMpbY9LZKsB/YYacoz.vWPdgFKJC', 'Test', 'Producteur', 'PRODUCTEUR', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `);
    if (prodResult.length) {
      await queryRunner.query(
        `INSERT INTO producteurs (id, "userId", address, city, region, pays, "yearsOfExperience")
         VALUES ($1, $2, 'Adresse de test', 'Lomé', 'Maritime', 'Togo', 5)
         ON CONFLICT ("userId") DO NOTHING`,
        [prodResult[0].id, prodResult[0].id],
      );
    }

    const achResult = await queryRunner.query(`
      INSERT INTO utilisateurs (id, email, "passwordHash", "lastName", "firstName", role, active)
      VALUES (gen_random_uuid(), 'acheteur@agri.local', '$2b$10$j6LY.iuVUtQStlBUQs3r/u3q.H3b9n9ftBxOPrSLaJ3akBp4gvpzi', 'Test', 'Acheteur', 'ACHETEUR', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `);
    if (achResult.length) {
      await queryRunner.query(
        `INSERT INTO acheteurs (id, "utilisateurId", "typeSociete", "nomSociete", region, pays, telephone, email)
         VALUES ($1, $2, 'Particulier', 'Acheteur Test', 'Maritime', 'Togo', null, 'acheteur@agri.local')
         ON CONFLICT ("utilisateurId") DO NOTHING`,
        [achResult[0].id, achResult[0].id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM acheteurs WHERE email = 'acheteur@agri.local'`);
    await queryRunner.query(`DELETE FROM producteurs WHERE "userId" IN (SELECT id::text FROM utilisateurs WHERE email = 'producteur@agri.local')`);
    await queryRunner.query(`DELETE FROM agents WHERE "utilisateurId" IN (SELECT id FROM utilisateurs WHERE email = 'agent@agri.local')`);
    await queryRunner.query(`DELETE FROM utilisateurs WHERE email IN ('admin@agri.local', 'agent@agri.local', 'producteur@agri.local', 'acheteur@agri.local')`);
  }
}
