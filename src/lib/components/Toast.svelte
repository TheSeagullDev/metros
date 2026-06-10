<!-- src/lib/components/Toast.svelte -->
<script>
	import { notifications, NOTIFICATION_TYPES } from '$lib/stores/notificationStore';
	import { fly } from 'svelte/transition';
</script>

<div class="pointer-events-none fixed right-0 bottom-0 z-50 flex flex-col gap-3 p-4 sm:p-6">
	{#each $notifications as notification (notification.id)}
		<div
			class="pointer-events-auto max-w-sm rounded-lg shadow-lg"
			class:bg-red-50={notification.type === NOTIFICATION_TYPES.ERROR}
			class:bg-green-50={notification.type === NOTIFICATION_TYPES.SUCCESS}
			class:bg-yellow-50={notification.type === NOTIFICATION_TYPES.WARNING}
			class:bg-blue-50={notification.type === NOTIFICATION_TYPES.INFO}
			in:fly={{ x: 400, duration: 300 }}
			out:fly={{ x: 400, duration: 200 }}
			role="alert"
			aria-live="assertive"
		>
			<div class="p-4">
				<!-- Header with title and close button -->
				<div class="flex items-start justify-between gap-3">
					<div class="flex flex-1 items-start gap-3">
						<!-- Icon -->
						<div class="mt-0.5 flex-shrink-0">
							{#if notification.type === NOTIFICATION_TYPES.ERROR}
								<svg
									class="h-5 w-5 text-red-600"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else if notification.type === NOTIFICATION_TYPES.SUCCESS}
								<svg
									class="h-5 w-5 text-green-600"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else if notification.type === NOTIFICATION_TYPES.WARNING}
								<svg
									class="h-5 w-5 text-yellow-600"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								<svg
									class="h-5 w-5 text-blue-600"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-hidden="true"
								>
									<path
										fill-rule="evenodd"
										d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</div>

						<!-- Content -->
						<div class="flex-1">
							<h3
								class="text-sm font-bold"
								class:text-red-900={notification.type === NOTIFICATION_TYPES.ERROR}
								class:text-green-900={notification.type === NOTIFICATION_TYPES.SUCCESS}
								class:text-yellow-900={notification.type === NOTIFICATION_TYPES.WARNING}
								class:text-blue-900={notification.type === NOTIFICATION_TYPES.INFO}
							>
								{notification.title}
							</h3>
							<p
								class="mt-1 text-sm"
								class:text-red-800={notification.type === NOTIFICATION_TYPES.ERROR}
								class:text-green-800={notification.type === NOTIFICATION_TYPES.SUCCESS}
								class:text-yellow-800={notification.type === NOTIFICATION_TYPES.WARNING}
								class:text-blue-800={notification.type === NOTIFICATION_TYPES.INFO}
							>
								{notification.message}
							</p>

							<!-- User action -->
							{#if notification.userAction}
								<p
									class="mt-2 text-xs font-semibold"
									class:text-red-700={notification.type === NOTIFICATION_TYPES.ERROR}
									class:text-green-700={notification.type === NOTIFICATION_TYPES.SUCCESS}
									class:text-yellow-700={notification.type === NOTIFICATION_TYPES.WARNING}
									class:text-blue-700={notification.type === NOTIFICATION_TYPES.INFO}
								>
									→ {notification.userAction}
								</p>
							{/if}

							<!-- Error code for support -->
							{#if notification.code && notification.type === NOTIFICATION_TYPES.ERROR}
								<p class="mt-2 font-mono text-xs opacity-60">
									Code: {notification.code}
								</p>
							{/if}
						</div>
					</div>

					<!-- Close button -->
					<button
						onclick={() => notifications.remove(notification.id)}
						class="inline-flex flex-shrink-0"
						aria-label="Close notification"
					>
						<svg
							class="h-5 w-5"
							class:text-red-600={notification.type === NOTIFICATION_TYPES.ERROR}
							class:text-green-600={notification.type === NOTIFICATION_TYPES.SUCCESS}
							class:text-yellow-600={notification.type === NOTIFICATION_TYPES.WARNING}
							class:text-blue-600={notification.type === NOTIFICATION_TYPES.INFO}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<!-- Progress bar -->
				{#if notification.duration > 0}
					<div
						class="mt-3 h-1 rounded-full bg-gradient-to-r"
						class:from-red-400={notification.type === NOTIFICATION_TYPES.ERROR}
						class:from-green-400={notification.type === NOTIFICATION_TYPES.SUCCESS}
						class:from-yellow-400={notification.type === NOTIFICATION_TYPES.WARNING}
						class:from-blue-400={notification.type === NOTIFICATION_TYPES.INFO}
						style={`animation: shrink ${notification.duration}ms linear forwards; transform-origin: left;`}
					></div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes shrink {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
