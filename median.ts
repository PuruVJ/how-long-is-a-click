import { createClient } from '@libsql/client';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './src/lib/server/schema';

const slabs = Array.from({ length: 100 }, (_, i) => i * 10).reduce((acc, curr) => {
	acc.set(curr, 0);
	return acc;
}, new Map<number, number>());

const { DB_TOKEN, DB_URL } = process.env;

const libsql_client = createClient({
	url: DB_URL!,
	authToken: DB_TOKEN,
});

const db = drizzle(libsql_client, { schema });

const data = await db.select().from(schema.clicks).all();

for (const row of data) {
	if (row.pointer_type !== 0) continue;

	for (const [key, value] of slabs) {
		if (row.duration <= key) {
			slabs.set(key, value + 1);
			break;
		}
	}
}

// console.log(slabs);

// Print in descending order of duration
console.log(new Map([...slabs.entries()].sort((a, b) => b[1] - a[1])));

console.log(findMedian(data.filter((r) => r.pointer_type === 0).map((row) => row.duration)));

function findMedian(arr: number[]) {
	arr.sort((a, b) => a - b);
	const middleIndex = Math.floor(arr.length / 2);

	if (arr.length % 2 === 0) {
		return (arr[middleIndex - 1] + arr[middleIndex]) / 2;
	} else {
		return arr[middleIndex];
	}
}
