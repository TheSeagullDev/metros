<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fail } from '@sveltejs/kit';
	import bg from '$lib/assets/background.png';
	import gotts from "$lib/assets/orange-black.png";

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
	class="flex h-screen flex-col items-center justify-between py-8 sm:py-4"
	style="background-image: url({bg}); background-size: cover"
>
	<div class="flex flex-col items-center justify-center my-4">
		<h4 class="text-sm font-thin text-white md:text-lg md:tracking-widest">
			THE HELEN HAYES YOUTH THEATRE PRESENTS
		</h4>
		<img
			src="https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,h=359,fit=crop/x1MQP53DI5u8ojA3/metroawards-gigapixel-cgi-6x-hNCmiXZgi6QtJzYb.png"
			alt=""
			class="mx-4 w-full sm:w-1/2"
		/>
	</div>
	{#if !otpState && !accessCodeState}
		<h1 class="font-sans text-4xl text-white my-2 font-montserrat">Official Livestream Home</h1>
		<div class="flex flex-col items-center gap-2 md:w-1/4">
			<button
				onclick={pay}
				class="w-full rounded-2xl bg-red-600 px-8 py-6 my-4 text-3xl font-bold text-white hover:bg-red-500"
				>WATCH LIVE</button
			>
			<button
				onclick={() => (otpState = true)}
				class="w-full sm:w-[85%] rounded-2xl bg-black p-4 text-white hover:bg-gray-900"
				><div class="text-sm">Already Purchased Access?</div>
				<div class="text-xs font-bold">Log in Here</div></button
			>
			<button
				onclick={() => (accessCodeState = true)}
				class="w-full sm:w-3/4 rounded-2xl bg-black p-4 text-md text-white hover:bg-gray-900"
				>SUPPORT/HELP</button
			>
		</div>
	{:else if otpState}
		<div class="m-4 rounded-2xl bg-blue-50 p-8 drop-shadow-2xl">
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
		<div class="m-4 rounded-2xl bg-blue-50 p-8 drop-shadow-2xl sm:w-1/2 xl:w-1/4">
			<h1 class="my-4 text-2xl">
				Enter an access code given by IMPAVL support below. ONLY do so if you have been instructed
				by support.
			</h1>
			<form action="?/redeemCode" method="POST">
				<div class="flex flex-col">
					<label for="code" class="text-lg">Enter access code:</label>

					<input type="tel" maxlength="6" name="code" id="code" />
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
	<div class="my-4 mx-2 rounded-md bg-gray-50 p-4 text-center sm:w-1/2 text-xs sm:text-sm">
		<h2>2026 LIVESTREAM PRESENTED BY:</h2>
		<img src={gotts} class="w-24 m-auto" alt="">
		<p class="my-2">
			The Guild of Technical Theatre Students (GOTTS) is an educational initiative dedicated to
			supporting, training, and recognizing student technicians and production leaders in theatre
			and live events throughout the region.
		</p>

		<p class="my-2">
			Through mentorship, professional experiences, and scholarship opportunities, GOTTS aims to
			elevate the visibility and standard of student technical theatre education.
		</p>
		<p>CLICK TO LEARN MORE!</p>
	</div>
</div>
