// src/lib/utils/errorHandler.js
import { notifications, ERROR_CODES } from '$lib/stores/notificationStore';

/**
 * Wrap API calls with automatic error handling
 * @param {Promise} promise - The API call
 * @param {string} errorCode - ERROR_CODE to use if error occurs
 * @returns {Promise} - Result or null if error
 */
export async function handleApiCall(promise, errorCode) {
	try {
		const response = await promise;

		if (!response.ok) {
			notifications.error(errorCode);
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error(`[${errorCode}]`, error);
		notifications.error(errorCode);
		return null;
	}
}

/**
 * Handle Supabase auth errors with user-friendly messages
 * @param {Error} error - Supabase auth error
 * @param {string} context - What action was being performed
 */
export function handleAuthError(error, context) {
	console.error(`[AUTH_ERROR_${context}]`, error);

	if (!error) return;

	const errorMsg = error.message?.toLowerCase() || '';

	if (context === 'login' && errorMsg.includes('invalid')) {
		notifications.error(ERROR_CODES.AUTH_PASSWORD_LOGIN_FAILED);
	} else if (context === 'otp_request') {
		notifications.error(ERROR_CODES.AUTH_OTP_FAILED);
	} else if (context === 'otp_verify' && errorMsg.includes('invalid')) {
		notifications.error(ERROR_CODES.AUTH_OTP_VERIFICATION_FAILED);
	} else if (context === 'signout') {
		notifications.error(ERROR_CODES.AUTH_SIGNOUT_FAILED);
	} else if (errorMsg.includes('session')) {
		notifications.error(ERROR_CODES.AUTH_SESSION_INVALID);
	} else {
		notifications.error(ERROR_CODES.UNEXPECTED_ERROR);
	}
}

/**
 * Wrap payment flow with error handling
 * Logs to console with context for support
 */
export function logPaymentError(step, error, details = {}) {
	const errorData = {
		timestamp: new Date().toISOString(),
		step,
		error: error?.message || error,
		...details
	};

	console.error('[PAYMENT_ERROR]', JSON.stringify(errorData, null, 2));
}

/**
 * Wrap stream loading with timeout
 * @param {Promise} promise - The stream loading promise
 * @param {number} timeoutMs - Timeout in milliseconds (default 5000)
 * @returns {Promise}
 */
export async function withTimeout(promise, timeoutMs = 5000) {
	return Promise.race([
		promise,
		new Promise((_, reject) =>
			setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
		)
	]);
}

/**
 * Wrap signout with timeout to prevent hanging
 * @param {Function} signoutFn - The supabase.auth.signOut function
 * @returns {Promise} - Resolves when signout completes or timeout
 */
export async function signoutWithTimeout(signoutFn, timeoutMs = 3000) {
	try {
		const signoutPromise = signoutFn();
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(() => reject(new Error('Signout timeout')), timeoutMs)
		);

		await Promise.race([signoutPromise, timeoutPromise]);
		notifications.success('Signed out');
		return true;
	} catch (error) {
		console.error('[SIGNOUT_ERROR]', error);
		// Force local logout
		localStorage.clear();
		sessionStorage.clear();
		notifications.warning('Signed out (forced local cleanup)');
		return true; // Return true anyway to proceed to redirect
	}
}

/**
 * Format error for support with all context
 * @returns {string} - Formatted error string for Discord/support
 */
export function formatErrorForSupport(errorCode, context = {}) {
	return `
**Error Code:** ${errorCode}
**Time:** ${new Date().toISOString()}
${Object.entries(context)
	.map(([key, value]) => `**${key}:** ${value}`)
	.join('\n')}
	`.trim();
}
