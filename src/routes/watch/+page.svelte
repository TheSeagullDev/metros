<script>
	import { redirect } from '@sveltejs/kit';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import '@mux/mux-player';
	import Banner from '$lib/components/Banner.svelte';

	let stream = $state();

	import bg from '$lib/assets/background.png';

	const supabase = $derived(page.data.supabase);

	let token = $state('');

	onMount(async () => {
		const res = await fetch('/api/playback');
		const data = await res.json();

		token = data.token;

		const result = await supabase.from('streams').select('*').eq('active', true).single();

		stream = result.data;
	});
	let offline = $state(false);
	let player = $state();

	function updateState() {
		console.log(player?.streamType, player?.readyState);

		offline = player?.streamType !== 'live' || player?.readyState < 2;
	}

	$effect(() => {
		if (player) {
			console.log('player', player);
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
				/>
			</div>
		{:else}
			<div
				class="m-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-gray-800 shadow-2xl sm:w-2/3"
			>
				<h1 class="animate-bounce text-2xl font-bold text-white">Livestream Loading...</h1>
			</div>
		{/if}
	<button
		class="m-4 rounded bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-400"
		onclick={async () => {
			await supabase.auth.signOut();
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
