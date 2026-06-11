<!-- src/routes/+layout.svelte - SIMPLIFIED -->

<script>
	import './layout.css';
	import Toast from '$lib/components/Toast.svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="manifest" href="/site.webmanifest" />
</svelte:head>

<Toast />

{@render children()}
