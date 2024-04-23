<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-french-toast';
	import { draggable } from '@neodrag/svelte';

	export let data;

	let start_time: number;
	let duration = 0;

	let pointer_type = '';

	function onDown(e: PointerEvent) {
		start_time = performance.now();
		pointer_type = e.pointerType;
	}

	function onUp() {
		duration = performance.now() - start_time;
	}
</script>

<form
	use:enhance={() => {
		return async ({ update, result }) => {
			await update();

			// @ts-ignore
			result.data.success ? toast.success(result.data.message) : toast.error(result.data.message);
		};
	}}
	method="post"
>
	<h1 use:draggable>How long does a click take?</h1>

	<br /><br />

	<input type="hidden" name="duration" value={duration} />
	<input type="hidden" name="pointer-type" value={pointer_type} />

	<button type="submit" on:pointerdown={onDown} on:pointerup={onUp}> Click me 🦄 </button>
</form>

<h3>{Math.floor(duration)}ms</h3>

<hr />

<section class="stats">
	<div class="average" use:draggable>
		<p>Average</p>
		<h2>{Math.floor(data.average.average_duration)}</h2>
		{data.average.count} clicks
	</div>

	{#each data.category_average as { pointer_type, average_duration, count }}
		<div class="average" use:draggable>
			<p>{pointer_type}</p>
			<h2>{Math.floor(average_duration)}</h2>
			{count}
		</div>
	{/each}
</section>

<footer>
	By <a href="https://x.com/puruvjdev">@puruvjdev</a> •
	<a target="_blank" rel="noreferrer" href="https://github.com/puruvj/how-long-is-a-click">Source</a
	>
</footer>

<style>
	button {
		box-shadow: var(--shadow-6);

		width: var(--size-fluid-8);
		height: var(--size-fluid-8);
		border-radius: var(--radius-blob-1);

		background-image: var(--gradient-25);
		color: var(--gray-9);
		font-size: 1.2rem;
		text-shadow: none;

		transition: transform 0.2s;
	}

	button:hover {
		transform: scale(1.1);
	}

	button:active {
		transform: scale(0.9);
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	h1 {
		text-align: center;
		cursor: move;
	}

	.stats {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}

	.average {
		background-color: var(--gray-8);
		border-radius: var(--radius-3);
		padding: var(--size-3);
		box-shadow: var(--shadow-3);
		border: 0.5px solid var(--gray-5);
		width: 200px;
		cursor: move;
	}

	.average p {
		color: var(--gray-5);
		text-transform: uppercase;
		font-weight: 500;
		font-size: 0.8rem;
	}

	.average h2 {
		font-size: var(--font-size-fluid-3);
	}
</style>
