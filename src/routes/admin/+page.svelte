<script>
	import { notifications, ERROR_CODES } from '$lib/stores/notificationStore';
	let { form } = $props();
</script>

<div class="h-screen bg-gray-800 p-4 text-gray-50">
	<h1 class="text-2xl">Super Secret Admin Page</h1>

	<form method="POST" action="?/generateCode">
		<button class="m-4 rounded-md bg-gray-600 p-4 hover:bg-gray-500">
			Generate Guest Pass
		</button>
	</form>

	<hr class="my-6" />

	<form method="POST" action="?/createPhoneOrder" class="flex flex-col gap-2 max-w-md">
		<label for="email">Email</label>

		<input
			type="email"
			name="email"
			required
			class="rounded bg-gray-700 p-2"
		/>

		<button
			type="submit"
			class="rounded-md bg-blue-600 p-3 hover:bg-blue-500"
		>
			Create Ticket
		</button>
	</form>

	{#if form?.ticket}
		<div class="mt-4 rounded bg-green-800 p-4">
			<h2 class="font-bold">Ticket Created</h2>

			<p>Email: {form.ticket.email}</p>
		</div>
	{/if}

	{#if form?.error}
		<div class="mt-4 rounded bg-red-800 p-4">
			{form.error}
		</div>
	{/if}

	{#if form?.code}
		<h2 class="bg-green-800 p-2">
			Support Code:
			{form.code}
		</h2>
	{/if}
</div>