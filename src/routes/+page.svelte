<!-- src/routes/+page.svelte -->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fail } from '@sveltejs/kit';
	import bg from '$lib/assets/background.png';
	import gotts from '$lib/assets/orange-black.png';
	import { tick } from 'svelte';
	import { notifications, ERROR_CODES } from '$lib/stores/notificationStore';
	import { handleAuthError } from '$lib/utils/errorHandler';

	const supabase = $derived(page.data.supabase);

	let { data, form } = $props();

	let otpState = $state(false);
	let accessCodeState = $state(false);
	let otpError = $state(null);
	let otpEmail = $state();
	let ticketValidated = $state(false);
	let otpToken = $state();
	let accessCode = $state();
	let checkoutToken = $state(null);
	let isInitializingPayment = $state(false);
	let resendCountdown = $state(0);
	let isResendDisabled = $state(false);

	$effect(async () => {
		if (form?.errorCode) {
			notifications.error(form.errorCode);
			return;
		}
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

	async function initializePayment() {
		isInitializingPayment = true;
		try {
			const response = await fetch('/api/helcim-init', {
				method: 'POST'
			});

			if (!response.ok) {
				console.error('[HELCIM_INIT_FAILED]', response.status);
				alert('Failed to initialize payment. Please try again.');
				return;
			}

			const data = await response.json();
			checkoutToken = data.checkoutToken;

			// Open Helcim iframe
			appendHelcimPayIframe(checkoutToken);
		} catch (error) {
			console.error('[HELCIM_INIT_ERROR]', error);
			alert('Failed to initialize payment. Please try again.');
		} finally {
			isInitializingPayment = false;
		}
	}

	function pay() {
		if (!checkoutToken) {
			initializePayment();
		} else {
			appendHelcimPayIframe(checkoutToken);
		}
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
		try {
			const response = await fetch('/api/payment-complete', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					rawDataResponse: message,
					checkoutToken: checkoutToken
				})
			});

			if (!response.ok) {
				notifications.error(ERROR_CODES.AUTH_PAYMENT_FAILED);
				return;
			}

			const user = await response.json();

			if (user.error) {
				notifications.error(ERROR_CODES.AUTH_PAYMENT_FAILED);
				return;
			}

			const { error } = await supabase.auth.signInWithPassword({
				email: user.email,
				password: user.password
			});

			if (error) {
				handleAuthError(error, 'login');
				return;
			}

			notifications.success('Access granted! Redirecting to stream...');
			window.location.href = '/watch';
		} catch (error) {
			console.error('[PAYMENT_ERROR]', error);
			notifications.error(ERROR_CODES.NETWORK_ERROR);
		}
	}

async function requestOtp() {
		otpError = null;
 
		try {
			console.log('[OTP_REQUEST] Verifying ticket for:', otpEmail);
			
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
 
			if (!verify.success) {
				otpError = 'No ticket found for that email';
				console.log('[OTP_REQUEST] No ticket found');
				return;
			}
 
			console.log('[OTP_REQUEST] Ticket verified, requesting OTP...');
 
			// Request OTP from Supabase
			const { error } = await supabase.auth.signInWithOtp({
				email: otpEmail,
				options: {
					shouldCreateUser: false
				}
			});
 
			if (error) {
				console.error('[OTP_REQUEST_ERROR]', error.message);
				
				// Check for rate limit error
				if (error.message.includes('you can only request this after')) {
					// Extract seconds from message: "you can only request this after 23 seconds"
					const match = error.message.match(/after (\d+) seconds/);
					const secondsLeft = match ? parseInt(match[1]) : 60;
					
					otpError = `Too many requests. Please wait ${secondsLeft} seconds before trying again.`;
					console.log('[OTP_REQUEST] Rate limited:', otpError);
				} else if (error.message.includes('No ticket')) {
					otpError = 'No ticket found for that email';
				} else {
					otpError = error.message || 'Failed to send OTP';
				}
				return;
			}
 
			console.log('[OTP_REQUEST] OTP sent successfully');
			
			// Move to verification step
			ticketValidated = true;
			otpError = null;
			
			// Start resend countdown
			startResendCountdown();
 
		} catch (err) {
			console.error('[OTP_REQUEST_EXCEPTION]', err);
			otpError = 'Failed to request OTP. Please try again.';
		}
	}
 
	function startResendCountdown() {
		resendCountdown = 60;
		isResendDisabled = true;
 
		const interval = setInterval(() => {
			resendCountdown -= 1;
 
			if (resendCountdown <= 0) {
				clearInterval(interval);
				isResendDisabled = false;
				resendCountdown = 0;
			}
		}, 1000);
	}
 
	async function submitOtp() {
		otpError = null;
 
		try {
			console.log('[OTP_VERIFY] Verifying OTP token');
 
			const { error } = await supabase.auth.verifyOtp({
				email: otpEmail,
				token: otpToken,
				type: 'email'
			});
 
			if (error) {
				console.error('[OTP_VERIFY_ERROR]', error.message);
				
				if (error.message.includes('invalid') || error.message.includes('expired')) {
					otpError = 'Invalid or expired code. Please try again.';
				} else {
					otpError = error.message || 'Failed to verify code';
				}
				return;
			}
 
			console.log('[OTP_VERIFY] OTP verified successfully');
			window.location.href = '/watch';
 
		} catch (err) {
			console.error('[OTP_VERIFY_EXCEPTION]', err);
			otpError = 'Failed to verify code. Please try again.';
		}
	}
 
	function resetOtpFlow() {
		otpState = false;
		ticketValidated = false;
		otpError = null;
		otpEmail = '';
		otpToken = '';
		resendCountdown = 0;
		isResendDisabled = false;
	}
</script>

<svelte:window
	onmessage={(event) => {
		const helcimPayJsIdentifierKey = 'helcim-pay-js-' + checkoutToken;

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
	class="fixed inset-0 -z-10 h-screen"
	style="background-image: url({bg}); background-size: cover; background-position: 50% 80%;"
></div>

<div class="flex h-screen flex-col items-center justify-between py-8 font-montserrat sm:py-4">
	<div class="my-4 flex flex-col items-center justify-center">
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
		<h1 class="my-2 text-3xl text-white sm:text-6xl">Official Livestream Home</h1>
		<div class="flex flex-col items-center gap-2 md:w-1/4">
			<button
				onclick={pay}
				disabled={isInitializingPayment}
				class="my-4 w-full rounded-2xl bg-red-600 px-8 py-6 text-3xl font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isInitializingPayment ? 'Initializing...' : 'PURCHASE ACCESS'}
			</button>
			<button
				onclick={() => (otpState = true)}
				class="w-full rounded-2xl bg-black p-4 text-white hover:bg-gray-900 sm:w-[85%]"
				><div class="text-sm">Already Purchased Access?</div>
				<div class="text-xs font-bold">Log in Here</div></button
			>
			<button
				onclick={() => (accessCodeState = true)}
				class="text-md w-full rounded-2xl bg-black p-4 text-white hover:bg-gray-900 sm:w-3/4"
				>SUPPORT/HELP</button
			>
		</div>
	{:else if otpState}
		<div class="m-4 rounded-2xl bg-blue-50 p-8 drop-shadow-2xl">
		{#if !ticketValidated}
			<!-- STEP 1: Enter email -->
			<h1 class="my-4 text-2xl">Use a previously purchased ticket</h1>
			
			{#if otpError}
				<div class="mb-4 rounded bg-red-100 p-3 text-red-800">
					<p class="text-sm font-semibold">{otpError}</p>
				</div>
			{/if}
 
			<div class="flex flex-col">
				<label for="email" class="text-lg font-semibold">Enter your email:</label>
				<input 
					type="email" 
					name="email" 
					id="email" 
					bind:value={otpEmail}
					placeholder="you@example.com"
					class="my-2 rounded border border-gray-300 px-3 py-2"
				/>
				<button
					onclick={requestOtp}
					class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400 disabled:opacity-50"
				>
					Send Code
				</button>
			</div>
 
		{:else}
			<!-- STEP 2: Enter OTP code with resend button -->
			<h1 class="my-4 text-2xl">Enter your code</h1>
			<p class="mb-4 text-sm text-gray-600">We've sent a 6-digit code to <strong>{otpEmail}</strong></p>
 
			{#if otpError}
				<div class="mb-4 rounded bg-red-100 p-3 text-red-800">
					<p class="text-sm font-semibold">{otpError}</p>
				</div>
			{/if}
 
			<div class="flex flex-col">
				<label for="otpToken" class="text-lg font-semibold">6-digit code:</label>
				<input 
					type="tel" 
					maxlength="6" 
					name="otpToken" 
					id="otpToken" 
					bind:value={otpToken}
					placeholder="000000"
					class="my-2 rounded border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest"
					inputmode="numeric"
				/>
 
				<button
					onclick={submitOtp}
					class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
				>
					Verify Code
				</button>
 
				<!-- Resend section -->
				<div class="mt-6 border-t pt-4">
					<p class="mb-3 text-center text-sm text-gray-600">Didn't receive a code?</p>
					<button
						onclick={requestOtp}
						disabled={isResendDisabled}
						class="w-full rounded border-2 border-orange-500 px-4 py-2 font-semibold text-orange-500 hover:bg-orange-50 disabled:border-gray-300 disabled:text-gray-400"
					>
						{#if isResendDisabled}
							Resend code in {resendCountdown}s
						{:else}
							Resend code
						{/if}
					</button>
				</div>
 
				<!-- Change email link -->
				<button
					onclick={() => {
						ticketValidated = false;
						otpError = null;
						otpToken = '';
						resendCountdown = 0;
						isResendDisabled = false;
					}}
					class="mt-3 text-center text-sm text-blue-600 hover:text-blue-800 underline"
				>
					Use different email
				</button>
			</div>
		{/if}
	</div>
 
	<!-- Go back button -->
	<div class="mt-4 text-center">
		<button
			onclick={resetOtpFlow}
			class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
		>
			Go back
		</button>
	</div>
 
	{:else}
		<div class="flex w-full flex-col items-stretch justify-center sm:w-2/3 sm:flex-row">
			<div
				class="m-4 flex flex-col justify-around rounded-2xl bg-blue-50 p-8 drop-shadow-2xl sm:w-1/2 xl:w-1/4"
			>
				<h1 class="text-lg">IMPAVL Support Information</h1>
				<p>Support email: <a href="support@IMPAVL.com" class="underline">support@IMPAVL.com</a></p>
				<p>Phone number: TBD</p>
				<p>
					In any support requests, please include your name, the email you purchased your ticket
					with, and your phone number, so we can assist you quicker!
				</p>
			</div>
			<div class="m-4 rounded-2xl bg-blue-50 p-8 drop-shadow-2xl sm:w-1/2 xl:w-1/4">
				<h1 class="text-md my-4">
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
		</div>
		<button
			onclick={() => (accessCodeState = false)}
			class="m-4 rounded bg-orange-500 px-4 py-2 text-2xl font-bold text-white hover:bg-orange-400"
			>Go back</button
		>
	{/if}
	<div
		class="mx-2 my-4 rounded-md bg-gray-50 p-4 text-center text-xs uppercase sm:text-sm lg:w-1/2"
	>
		<h2 class="font-bold">2026 LIVESTREAM PRESENTED BY:</h2>
		<div class="flex w-full justify-center">
			<a href="https://www.impavl.com/gotts" target="_blank"
				><img src={gotts} class="w-24 sm:w-48" alt="" /></a
			>
		</div>
		<p class="my-2 font-semibold">
			The Guild of Technical Theatre Students (<a
				href="https://www.impavl.com/gotts"
				class="underline"
				target="_blank">GOTTS</a
			>) is an educational initiative dedicated to supporting, training, and recognizing student
			technicians and production leaders in theatre and live events throughout the region.
		</p>

		<p class="my-2 font-semibold">
			Through mentorship, professional experiences, and scholarship opportunities, GOTTS aims to
			elevate the visibility and standard of student technical theatre education.
		</p>
		<p class="italic underline">
			<a href="https://www.impavl.com/gotts" target="_blank">CLICK TO LEARN MORE!</a>
		</p>
	</div>
</div>
