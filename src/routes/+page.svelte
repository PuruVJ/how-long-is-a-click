<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { draggable } from '@neodrag/svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-french-toast';

	const { data } = $props();

	let start_time = $state<number>(0);
	let duration = $state(0);

	let pointer_type = $state('');

	function onDown(e: PointerEvent) {
		start_time = performance.now();
		pointer_type = e.pointerType;
	}

	function onUp() {
		duration = performance.now() - start_time;
	}

	onMount(() => {
		setInterval(() => {
			invalidateAll();
		}, 5000);
	});
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
	<h1 use:draggable>How long is a click?</h1>

	<br /><br />

	<input type="hidden" name="duration" value={duration} />
	<input type="hidden" name="pointer-type" value={pointer_type} />

	<button type="submit" onpointerdown={onDown} onpointerup={onUp}> Click me 🦄 </button>
</form>

<h3>{Math.floor(duration)}ms</h3>

<hr />

<section class="stats">
	{#each data.rows as { type, average_duration, count }}
		<div class="average" use:draggable>
			<p>{type}</p>
			<h2>{average_duration}</h2>
			{count}
		</div>
	{/each}
</section>

<footer>
	By <a href="https://x.com/puruvjdev">@puruvjdev</a> •
	<a target="_blank" rel="noreferrer" href="https://github.com/puruvj/how-long-is-a-click">source</a
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
