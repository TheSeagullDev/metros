<script>
	import { notifications, ERROR_CODES } from '$lib/stores/notificationStore';
	let { form } = $props();
</script>

<div class="h-screen bg-gray-800 p-4 text-gray-50">
	<h1 class="text-2xl">Super Secret Admin Page</h1>

	<form method="POST" action="?/generateCode">
		<button class="m-4 rounded-md bg-gray-600 p-4 hover:bg-gray-500"> Generate Guest Pass </button>
	</form>

	{#if form?.code}
		<h2 class="bg-green-800 p-2">
			Support Code:
			{form.code}
		</h2>
	{/if}
</div>
