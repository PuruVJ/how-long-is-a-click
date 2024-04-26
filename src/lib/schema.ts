import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const clicks = sqliteTable('clicks', {
	id: text('id', { length: 26 }).notNull().primaryKey(),
	duration: integer('duration', { mode: 'number' }).notNull(),
	pointer_type: integer('pointer_type').notNull(),
});

export const stats_table = sqliteTable('stats', {
	type: integer('duration', { mode: 'number' }).notNull().primaryKey(),
	average_duration: integer('average_duration', { mode: 'number' }).notNull(),
	count: integer('count', { mode: 'number' }).notNull(),
});
