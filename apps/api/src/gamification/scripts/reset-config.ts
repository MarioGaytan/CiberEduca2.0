/**
 * Script para resetear la configuración de gamificación
 * Ejecutar con: npx ts-node -r tsconfig-paths/register apps/api/src/gamification/scripts/reset-config.ts
 * O simplemente borrar la colección desde MongoDB Compass
 */
import { connect, connection } from 'mongoose';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '..', '..', '..', '..', '..', '.env') });

async function resetGamificationConfig() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await connect(uri);

  console.log('Deleting gamificationconfigs collection...');
  await connection.db?.collection('gamificationconfigs').deleteMany({});

  console.log(
    'Done! The config will be recreated with defaults on next API request.',
  );
  await connection.close();
  process.exit(0);
}

resetGamificationConfig().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
