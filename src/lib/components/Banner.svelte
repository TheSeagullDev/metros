<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	const supabase =
		$derived(page.data.supabase);

	let banners = $state([]);

	let current = $state(0);

	async function loadBanners() {

		const { data } =
			await supabase
				.from('banners')
				.select('*')
				.eq('active', true);

		banners = data || [];
	}

	onMount(async () => {

		await loadBanners();

		// rotate messages

		setInterval(() => {

			if (banners.length > 0) {
				current =
					(current + 1)
					% banners.length;
			}

		}, 5000);

		// realtime updates

		supabase
			.channel('banners')

			.on(
				'postgres_changes',

				{
					event: '*',
					schema: 'public',
					table: 'banners'
				},

				async () => {
					await loadBanners();
				}
			)

			.subscribe();
	});
</script>

{#if banners.length > 0}
	<div class="banner">
		<img src="" alt="">
	</div>
{/if}