<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fail } from '@sveltejs/kit';
	import bg from '$lib/assets/background.png';

	const supabase = $derived(page.data.supabase);

	let { data, form } = $props();

	let otpState = $state(false);
	let accessCodeState = $state(false);
	let otpError = $state(null);
	let otpEmail = $state();
	let ticketValidated = $state(false);
	let otpToken = $state();
	let accessCode = $state();

	$effect(async () => {
		if (form?.email && form?.password) {
			const { error } = await supabase.auth.signInWithPassword({
				email: form.email,
				password: form.password
			});

			if (!error) {
				window.location.href = '/watch';
			}
		}
	});

	function pay() {
		appendHelcimPayIframe(data.checkoutToken);
	}

	async function signup() {
		const { error } = await supabase.auth.signUp({
			email,
			password
		});
		if (!error) {
			window.location.href = '/watch';
		}
		console.log(error);
	}

	async function login() {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (!error) {
			window.location.href = '/watch';
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

		if (verify.success) {
			ticketValidated = true;
			const { error } = await supabase.auth.signInWithOtp({
				email: otpEmail,
				options: {
					shouldCreateUser: false
				}
			});
		} else {
			otpError = 'No ticket found';
		}
	}

	async function submitOtp() {
		const { error } = await supabase.auth.verifyOtp({
			email: otpEmail,
			token: otpToken,
			type: 'email'
		});

		if (!error) {
			window.location.href = '/watch';
		}

		console.log(error);
	}

	async function submitAccessCode() {}
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
	{#if !otpState && !accessCodeState}
		<div class="flex flex-col sm:flex-row">
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
			<button
				onclick={() => (accessCodeState = true)}
				class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
				>Have an Access Code?</button
			>
		</div>
	{:else if otpState}
		<div class="rounded-2xl bg-blue-50 p-8 drop-shadow-2xl m-4">
			<h1 class="my-4 text-2xl">Use a previously purchased ticket</h1>
			{#if otpError}
				<h2 class="text-lg text-red-500">Error: {otpError}</h2>
			{/if}
			{#if !ticketValidated}
				<div class="flex flex-col">
					<label for="email" class="text-lg">Enter your email:</label>
					<input type="email" name="email" id="email" bind:value={otpEmail} />
					<button
						onclick={requestOtp}
						class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
						>Submit</button
					>
				</div>
			{:else}
				<div class="flex flex-col">
					<label for="otpToken" class="text-lg"
						>Check your email and enter the six digit code below:</label
					>
					<input type="tel" maxlength="6" name="otpToken" id="otpToken" bind:value={otpToken} />
					<button
						onclick={submitOtp}
						class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
						>Submit</button
					>
				</div>
			{/if}
		</div>
		<div>
			<button
				onclick={() => (otpState = false)}
				class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
				>Go back</button
			>
		</div>
	{:else}
		<div class="rounded-2xl bg-blue-50 p-8 drop-shadow-2xl sm:w-1/2 xl:w-1/4 m-4">
			<h1 class="my-4 text-2xl">
				Enter an access code given by IMPAVL support below. ONLY do so if you have been instructed
				by support.
			</h1>
			<form action="?/redeemCode" method="POST">
			<div class="flex flex-col">
				<label for="code" class="text-lg">Enter access code:</label>
				
					<input
						type="tel"
						maxlength="6"
						name="code"
						id="code"
					/>
					<button
						type="submit"
						class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
						>Submit</button
					>
				
			</div>
			</form>
		</div>
		<button
			onclick={() => (accessCodeState = false)}
			class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
			>Go back</button
		>
	{/if}
</div>
