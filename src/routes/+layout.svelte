<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	import Toast from '$lib/components/Toast.svelte';

	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';

	let { data, children } = $props();

	$effect(() => {
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, session) => {
			if (session?.expires_at !== page.data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toast />

{@render children()}
