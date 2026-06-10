<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import '@mux/mux-player';

	import Banner from '$lib/components/Banner.svelte';
	import bg from '$lib/assets/background.png';

	let { data } = $props();

	const stream = $derived(data.stream);
	const token = $derived(data.token);

	let player = $state();

	const supabase = $derived(page.data.supabase);

	$effect(() => {
		if (player) {
			console.log('[PLAYER CREATED]', {
				readyState: player.readyState,
				streamType: player.streamType
			});
		}
	});
</script>

<div
	class="flex h-screen flex-col items-center justify-center p-2"
	style="background-image: url({bg}); background-size: cover; background-position: 50% 80%;"
>
	<Banner></Banner>
	{#if token && stream}
		<div class="m-4 aspect-video w-full overflow-hidden rounded-xl shadow-2xl sm:w-2/3">
			<mux-player
				bind:this={player}
				playback-id={stream.playback_id}
				playback-token={token}
				poster="https://metros.noahsiegel.dev/thumbnails/IMPLOGO.png"
				stream-type="live"
				onerror={(e) => {
					console.error('[MUX ERROR]', e);
				}}
				onplaying={() => {
					console.log('[MUX] playing');
				}}
				onwaiting={() => {
					console.log('[MUX] waiting');
				}}
				onloadedmetadata={() => {
					console.log('[MUX] metadata loaded');
				}}
			></mux-player>
		</div>
	{:else}
		<div
			class="m-4 flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-gray-800 shadow-2xl sm:w-2/3"
		>
			{#if errorMessage}
				<h1 class="text-xl font-bold text-red-400">Failed to load stream</h1>

				<p class="mt-2 text-white">
					{errorMessage}
				</p>

				<button
					class="mt-4 rounded bg-orange-500 px-4 py-2 text-white"
					onclick={() => location.reload()}
				>
					Retry
				</button>
			{:else}
				<h1 class="animate-bounce text-2xl font-bold text-white">Livestream Loading...</h1>
			{/if}
		</div>
	{/if}
	<button
		class="m-4 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-400"
		onclick={async () => {
			console.log('attempting signout');

			try {
				const result = await supabase.auth.signOut();

				console.log('signout result', result);

				console.log('signed out');
			} catch (err) {
				console.error('signout error', err);
			}
			console.log('signed out');
			await goto('/');
		}}>Sign out</button
	>
</div>

<style>
	mux-player {
		width: 100%;
		height: 100%;
	}
</style>
