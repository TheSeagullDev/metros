<script>
	import { redirect } from '@sveltejs/kit';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { PUBLIC_MUX_PLAYBACK_ID } from '$env/static/public';

	let token = $state('');

	onMount(async () => {
		await import('@mux/mux-player');

		const res = await fetch('/api/playback');
		const data = await res.json();

		token = data.token;
	});
</script>

{#if token}
	<mux-player
		playback-id={PUBLIC_MUX_PLAYBACK_ID}
		playback-token={token}
	/>
{/if}
<button
	onclick={async () => {
		await supabase.auth.signOut();
		await goto('/');
	}}>Sign out</button
>
