<script lang="ts">
	import type { get_stats } from '$lib/server/stats';

	export let data: Awaited<ReturnType<typeof get_stats>>;
</script>

<section>
	<div class="top" style="display: flex;">
		<img src="https://how-long-is-a-click.com/logo.png" alt="you are of no use" />
		<h1>how-long-is-a-click.com</h1>
	</div>

	<div class="block" style="display: flex;"></div>

	<div style="display: flex;width: 100%;">
		{#each data.slice(1) as { type, average_duration, count }}
			<div class="average" style="display: flex;">
				<p>{type}</p>
				<h2>{average_duration}</h2>
				<span class="count"
					>{count}
					<span style="color: #adb5bd; margin-left: 10ch;">click{count > 1 ? 's' : ''}</span></span
				>
			</div>
		{/each}
	</div>
</section>

<style>
	.top {
		display: flex;
		gap: 2rem;
		align-items: center;
	}

	h1 {
		font-size: 5rem;
		line-height: 1;
	}

	img {
		width: 100px;
		height: 100px;
	}

	section {
		height: 100%;
		width: 100%;

		background-color: #010811;
		color: white;

		padding: 3rem;

		display: flex;
		flex-direction: column;
	}

	.block {
		display: block;
		width: 100%;

		height: 50px;
	}

	.average {
		flex: 1 1 auto;
		flex-direction: column;
		padding: 2rem;
		cursor: move;
	}

	.average:not(:last-child) {
		border-right: 2px solid #2c2c2c;
	}

	.average p {
		color: #adb5bd;
		text-transform: uppercase;
		font-weight: 500;
		font-size: 1.6rem;
	}

	.average h2 {
		font-size: 7.218rem;
		line-height: 1;

		margin-top: -1rem;
	}

	.average .count {
		font-size: 2rem;
	}
</style>
