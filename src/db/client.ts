import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const sqlite = openDatabaseSync('ytcurator.db', { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });
export { schema };
