<!-- src/routes/+layout.svelte - SIMPLIFIED -->

<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toast from '$lib/components/Toast.svelte';

	let { data, children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toast />

{@render children()}