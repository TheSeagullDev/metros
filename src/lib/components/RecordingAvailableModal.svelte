<!-- src/lib/components/RecordingAvailableModal.svelte -->

<script>
	let isOpen = $state(true);
	let isDismissed = $state(false);

	function closeModal() {
		isOpen = false;
		// Remember dismissal for this session (localStorage persists across page reloads)
		isDismissed = true;
	}

	// Check if user already dismissed this
</script>

{#if isOpen && !isDismissed}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/50"
		onclick={closeModal}
	></div>

	<!-- Modal -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative max-w-md rounded-lg bg-white p-6 pt-10 shadow-xl">
			<!-- Close button -->
			<button
				onclick={closeModal}
				class="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
				aria-label="Close"
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Content -->
			<div class="text-center">
				<h2 class="mb-2 text-2xl font-bold text-gray-900">Livestream Ticket Includes Replay Access!</h2>
				<p class="mb-6 text-gray-600">
					If you purchased access to the live event, there is no need to purchase again. Simply login using the same email you used at checkout to watch the replay.
				</p>
			</div>
		</div>
	</div>
{/if}

<!-- 
USAGE:
1. Import in your home page: import RecordingAvailableModal from '$lib/components/RecordingAvailableModal.svelte';
2. Add to template: <RecordingAvailableModal />
3. User sees modal once per session
4. Can dismiss by:
   - Clicking X button
   - Clicking backdrop
   - Clicking "Watch Recording" button
5. Won't show again until localStorage is cleared or session restarts

CUSTOMIZE:
- Change the heading/message text
- Change the "Watch Recording" link to wherever your recording is hosted
- Change colors (bg-orange-500 to whatever)
-->