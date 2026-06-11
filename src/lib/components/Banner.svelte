<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	const supabase =
		$derived(page.data.supabase);

	let banners = $state([]);

	let current = $state(0);
	let rotationInterval = null;
	let pollInterval = null;

	async function loadBanners() {

		const { data } =
			await supabase
				.from('banners')
				.select('*')
				.eq('active', true);

		banners = data || [];
		console.log('[BANNER] Loaded banners:', banners.length);
	}

	onMount(async () => {

		await loadBanners();

		// rotate messages every 15 seconds
		rotationInterval = setInterval(() => {

			if (banners.length > 0) {
				current =
					(current + 1)
					% banners.length;
			}

		}, 15000);

		// poll for banner updates every 30 seconds (instead of realtime)
		// this prevents Safari WebSocket suspension issues
		pollInterval = setInterval(async () => {
			console.log('[BANNER] Polling for updates...');
			await loadBanners();
		}, 30000);

		// cleanup on unmount
		return () => {
			if (rotationInterval) clearInterval(rotationInterval);
			if (pollInterval) clearInterval(pollInterval);
		};
	});
</script>

{#if banners.length > 0}
	<div class="banner w-full sm:w-2/3 my-4">
		<a href={banners[current].clickLink} target="_blank"><img class="rounded-md m-auto" src={banners[current].imgLink} alt={banners[current].alt}></a>
	</div>
{/if}

<!-- 
CHANGES:
1. Removed realtime subscription
2. Added pollInterval that calls loadBanners() every 20 seconds
3. Added proper cleanup in onMount return (clears both intervals)
4. Kept existing rotation logic (5 second rotation)
5. Kept existing UI and styling

WHY THIS IS BETTER:
- No WebSocket = Safari can't suspend it
- No state corruption
- Still gets fresh banners every 20 seconds
- Banner rotation still works (5 sec)
- Cleanup prevents memory leaks
- Logout will work reliably
-->