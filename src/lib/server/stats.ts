import { POINTER_TYPES } from '$lib/constants';
import { stats_table } from '$lib/schema';
import { db } from './db';

export async function get_stats() {
	const data = await db.select().from(stats_table);

	let average_duration_sum = 0;
	let total_count = 0;
	for (const row of data) {
		average_duration_sum += row.count * row.average_duration;
		total_count += row.count;
	}

	return [
		{
			type: 'all',
			average_duration: Math.floor(average_duration_sum / total_count),
			count: total_count,
		},
		...data.map((r) => ({
			...r,
			type: POINTER_TYPES[r.type],
			average_duration: Math.floor(r.average_duration),
		})),
	];
}
