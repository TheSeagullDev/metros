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
	class="flex h-screen flex-col items-center justify-between"
	style="background-image: url({bg}); background-size: cover"
>
	{#if token && stream}
		<Banner></Banner>
		<img
			src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,h=359,fit=crop/x1MQP53DI5u8ojA3/metroawards-gigapixel-cgi-6x-hNCmiXZgi6QtJzYb.png"
			alt=""
			class="m-4 w-1/2"
		/>
		<div class="m-4 aspect-video w-full overflow-hidden rounded-xl shadow-2xl sm:w-2/3">
			<mux-player
				bind:this={player}
				playback-id={stream.playback_id}
				playback-token={token}
				poster="https://i.ibb.co/kgddFCp5/IMPLogo.png"
				stream-type="live"
			/>
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
