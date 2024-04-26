<script>
	import { Toaster } from 'svelte-french-toast';
	import '../lib/global.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		if (!('PointerEvent' in window)) {
			// @ts-ignore
			await import('@wessberg/pointer-events');
		}
	});
</script>

<slot />

{#await Promise.resolve() then _}
	<Toaster position="bottom-right" />
{/await}
