<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	const supabase = $derived(page.data.supabase);

	let banners = $state([]);

	let current = $state(0);
	let rotationInterval = null;
	let pollInterval = null;
	let error = $state(null); // Add error state

	async function loadBanners() {
		try {
			console.log('[BANNER] loadBanners() called');

			const { data, error: queryError } = await supabase
				.from('banners')
				.select('*')
				.eq('active', true);

			if (queryError) {
				console.error('[BANNER] SUPABASE ERROR:', queryError);
				console.error('[BANNER] Error code:', queryError.code);
				console.error('[BANNER] Error message:', queryError.message);
				console.error('[BANNER] Full error:', JSON.stringify(queryError, null, 2));
				error = `${queryError.code}: ${queryError.message}`;
				return;
			}

			console.log('[BANNER] Query returned:', data);
			banners = data || [];
			console.log('[BANNER] Banners state updated. Count:', banners.length);

			if (banners.length === 0) {
				console.warn('[BANNER] No active banners found in database');
			}
		} catch (err) {
			console.error('[BANNER] Exception in loadBanners:', err);
			error = `Exception: ${err.message}`;
		}
	}

	onMount(async () => {
		console.log('[BANNER] Component mounted');

		await loadBanners();

		// rotate messages every 5 seconds
		rotationInterval = setInterval(() => {
			if (banners.length > 0) {
				current = (current + 1) % banners.length;
				console.log('[BANNER] Rotated to index:', current);
			}
		}, 30000);

		// poll for banner updates every 20 seconds
		pollInterval = setInterval(async () => {
			console.log('[BANNER] Polling for updates...');
			await loadBanners();
		}, 20000);

		console.log('[BANNER] Intervals set up - rotation:', rotationInterval, 'poll:', pollInterval);

		// cleanup on unmount
		return () => {
			console.log('[BANNER] Component unmounting, cleaning up intervals');
			if (rotationInterval) clearInterval(rotationInterval);
			if (pollInterval) clearInterval(pollInterval);
		};
	});
</script>

{#if error}
	<div class="banner my-4 w-full rounded bg-red-100 p-4 text-red-800 sm:w-2/3">
		<p>Banner error: {error}</p>
	</div>
{:else if banners.length > 0}
	<div class="banner my-4 w-full sm:w-2/3">
		<a href={banners[current].clickLink} target="_blank"
			><img
				class="m-auto rounded-md"
				src={banners[current].imgLink}
				alt={banners[current].alt}
			/></a
		>
	</div>
{:else}
	<!-- Silent: no banners, no error -->
{/if}

<!-- 
ADDED:
1. Try/catch around loadBanners() with explicit error logging
2. Check for queryError from Supabase
3. Added error state to show errors in UI
4. Detailed console.log() at each step
5. Now if something fails, you'll see it in console AND in the UI

Check browser console for [BANNER] logs when in broken state.
-->
