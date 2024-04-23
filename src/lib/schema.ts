import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const clicks = sqliteTable('clicks', {
	id: text('id').notNull().primaryKey(),
	duration: integer('duration', { mode: 'number' }).notNull(),
	pointer_type: integer('pointer_type').notNull(),
	timestamp: integer('timestamp', { mode: 'timestamp_ms' })
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export const stats_table = sqliteTable('stats', {
	type: text('type').notNull().primaryKey(),
	average_duration: integer('average_duration', { mode: 'number' }).notNull(),
	count: integer('count', { mode: 'number' }).notNull(),
});
