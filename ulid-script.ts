/**
 * mouse = 0;
 * touch: 1;
 * pen: 2;
 * eraser: 3;
 * other: 4
 */

import { createClient } from '@libsql/client';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import fs from 'node:fs/promises';
import { ulid } from 'ulid';
import * as schema from './src/lib/schema';

const pointer_types = ['mouse', 'touch', 'pen', 'eraser', 'other'];

const { DB_TOKEN, DB_URL } = process.env;

const libsql_client = createClient({
	url: DB_URL!,
	authToken: DB_TOKEN,
});

const db = drizzle(libsql_client, { schema });

// // Save old data
// function save_old_data() {
// 	return db.transaction(async (tx) => {
// 		const query = await tx.select().from(schema.clicks).all();

// 		// Make new data from this query
// 		const new_rows = query
// 			.map((row) => ({
// 				id: ulid(+row.timestamp),
// 				duration: Math.floor(row.duration),
// 				pointer_type:
// 					(pointer_types.indexOf(row.pointer_type + '') + pointer_types.length) %
// 					pointer_types.length,
// 			}))
// 			.filter((row) => row.duration > 0 && row.duration <= 1000);

// 		// Save the data
// 		fs.writeFile('./data.json', JSON.stringify(new_rows, null, 2));
// 	});
// }

// async function populate_new_data() {
// 	const data = JSON.parse(
// 		await fs.readFile('./data.json', 'utf-8')
// 	) as (typeof schema.clicks.$inferSelect)[];

// 	// Write to the table
// 	// for (const datum of data) {
// 	await db.insert(schema.clicks).values(data);
// 	// }

// 	// Now recalculating the stats from the pointer_type until now
// 	const groups = data.reduce((acc, row) => {
// 		if (!acc[row.pointer_type]) {
// 			acc[row.pointer_type] = {
// 				average_duration: 0,
// 				count: 0,
// 			};
// 		}

// 		acc[row.pointer_type].average_duration =
// 			(acc[row.pointer_type].average_duration * acc[row.pointer_type].count + row.duration) /
// 			(acc[row.pointer_type].count + 1);

// 		acc[row.pointer_type].count++;

// 		return acc;
// 	}, {} as Record<string, { average_duration: number; count: number }>);

// 	// Now insert the stats
// 	const stats = Object.entries(groups).map(([pointer_type, { average_duration, count }]) => ({
// 		type: +pointer_type,
// 		average_duration,
// 		count,
// 	}));

// 	// Insert the stats
// 	await db.insert(schema.stats_table).values(stats);
// }

// await populate_new_data();

const query = await db.select().from(schema.clicks).all();

// calculate the average duration
const groups = query.reduce((acc, row) => {
	if (!acc[row.pointer_type]) {
		acc[row.pointer_type] = {
			average_duration: 0,
			count: 0,
		};
	}

	acc[row.pointer_type].average_duration =
		(acc[row.pointer_type].average_duration * acc[row.pointer_type].count + row.duration) /
		(acc[row.pointer_type].count + 1);

	acc[row.pointer_type].count++;

	return acc;
}, {} as Record<string, { average_duration: number; count: number }>);

console.log(groups);
