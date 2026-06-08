<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import bg from '$lib/assets/background.png';

	const supabase = $derived(page.data.supabase);

	let email = 'test@test.com';

	let { data } = $props();

	let otpState = $state(false);
	let otpError = $state(null);
	let otpEmail = $state();

	function pay() {
		appendHelcimPayIframe(data.checkoutToken);
	}

	async function signup() {
		const { error } = await supabase.auth.signUp({
			email,
			password
		});
		if (!error) {
			await goto('/watch');
		}
		console.log(error);
	}

	async function login() {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (!error) {
			await goto('/watch');
		}

		console.log(error);
	}

	async function paymentSucess(message) {
		const response = await fetch('/api/payment-complete', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				rawDataResponse: message,
				checkoutToken: data.checkoutToken
			})
		});

		if (!response.ok) {
			throw new Error('Payment validation failed');
		}

		const user = await response.json();

		console.log(user);
		const { error } = await supabase.auth.signInWithPassword({
			email: user.email,

			password: user.password
		});

		if (!error) {
			window.location.href = '/watch';
		}
	}

	async function requestOtp() {
		const response = await fetch('/api/verify-ticket', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email: otpEmail
			})
		}); 

		const verify = await response.json();

		if(verify.success) {
			
		}
		else {
			otpError = "No ticket found";
		}
	}
</script>

<svelte:window
	onmessage={(event) => {
		const helcimPayJsIdentifierKey = 'helcim-pay-js-' + data.checkoutToken;

		if (event.data.eventName === helcimPayJsIdentifierKey) {
			if (event.data.eventStatus === 'ABORTED') {
				console.error('Transaction failed!', event.data.eventMessage);
			}

			if (event.data.eventStatus === 'SUCCESS') {
				console.log(JSON.parse(event.data.eventMessage));
				paymentSucess(event.data.eventMessage)
					.then((response) => console.log(response))
					.catch((err) => console.error(err));
			}

			if (event.data.eventStatus === 'HIDE') {
				console.log('Modal or confirmation screen closed.');
			}
		}
	}}
/>

<div
	class="flex h-screen flex-col items-center justify-between py-32 sm:py-16"
	style="background-image: url({bg}); background-size: cover"
>
	<img
		src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,h=359,fit=crop/x1MQP53DI5u8ojA3/metroawards-gigapixel-cgi-6x-hNCmiXZgi6QtJzYb.png"
		alt=""
		class="m-4 w-2/3"
	/>
	{#if !otpState}
		<div>
			<button
				onclick={pay}
				class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
				>Buy Livestream Ticket</button
			>
			<button
				onclick={() => (otpState = true)}
				class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
				>Already Bought a Ticket?</button
			>
		</div>
	{:else}
		<div class="rounded-2xl p-8 drop-shadow-2xl bg-blue-50">
			<h1 class="text-2xl my-4">Check your ticket status</h1>
			{#if otpError}
			<h2 class="text-lg text-red-500">Error: {otpError}</h2>
			{/if}
			<div class="flex flex-col">
				<label for="email" class="text-lg">Enter your email:</label>
				<input type="email" name="email" id="email" bind:value={otpEmail}/>
				<button onclick={requestOtp} class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400">Submit</button>
			</div>
		</div>
		<div>
			<button
				onclick={() => (otpState = false)}
				class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
				>Go back</button
			>
		</div>
	{/if}
</div>
