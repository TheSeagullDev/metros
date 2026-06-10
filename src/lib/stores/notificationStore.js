// src/lib/stores/notificationStore.js
import { nanoid } from 'nanoid';
import { writable } from 'svelte/store';

/**
 * Notification types and their display properties
 */
export const NOTIFICATION_TYPES = {
	ERROR: 'error',
	SUCCESS: 'success',
	WARNING: 'warning',
	INFO: 'info'
};

/**
 * Error codes for support/diagnosis
 * Format: "CATEGORY_SPECIFIC_ERROR"
 */
export const ERROR_CODES = {
	// Auth errors
	AUTH_PAYMENT_FAILED: 'AUTH_PAYMENT_FAILED',
	AUTH_PASSWORD_LOGIN_FAILED: 'AUTH_PASSWORD_LOGIN_FAILED',
	AUTH_OTP_FAILED: 'AUTH_OTP_FAILED',
	AUTH_OTP_VERIFICATION_FAILED: 'AUTH_OTP_VERIFICATION_FAILED',
	AUTH_SIGNOUT_FAILED: 'AUTH_SIGNOUT_FAILED',
	AUTH_SESSION_INVALID: 'AUTH_SESSION_INVALID',

	// Payment errors
	PAYMENT_HELCIM_HASH_INVALID: 'PAYMENT_HELCIM_HASH_INVALID',
	PAYMENT_HELCIM_API_ERROR: 'PAYMENT_HELCIM_API_ERROR',
	PAYMENT_USER_CREATION_FAILED: 'PAYMENT_USER_CREATION_FAILED',
	PAYMENT_TICKET_CREATION_FAILED: 'PAYMENT_TICKET_CREATION_FAILED',

	// Ticket/access errors
	TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
	ACCESS_CODE_INVALID: 'ACCESS_CODE_INVALID',
	ACCESS_CODE_ALREADY_USED: 'ACCESS_CODE_ALREADY_USED',

	// Stream errors
	STREAM_NOT_FOUND: 'STREAM_NOT_FOUND',
	STREAM_LOAD_TIMEOUT: 'STREAM_LOAD_TIMEOUT',
	MUX_LOAD_FAILED: 'MUX_LOAD_FAILED',

	// Generic errors
	NETWORK_ERROR: 'NETWORK_ERROR',
	UNEXPECTED_ERROR: 'UNEXPECTED_ERROR'
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
	[ERROR_CODES.AUTH_PAYMENT_FAILED]: {
		title: 'Payment failed',
		message:
			"We couldn't process your payment. Check your card details and try again. If the problem persists, contact support.",
		userAction: 'Retry payment or contact support@IMPAVL.com'
	},
	[ERROR_CODES.AUTH_PASSWORD_LOGIN_FAILED]: {
		title: 'Login failed',
		message:
			'Email or password is incorrect. Try again or use "Returning Users" to reset with an email code.',
		userAction: 'Check your email and password'
	},
	[ERROR_CODES.AUTH_OTP_FAILED]: {
		title: 'Code not found',
		message: 'No ticket found for that email. Make sure you entered the email you purchased with.',
		userAction: 'Check your email address or contact support'
	},
	[ERROR_CODES.AUTH_OTP_VERIFICATION_FAILED]: {
		title: 'Invalid code',
		message: 'The code you entered is incorrect or expired. Check your email and try again.',
		userAction: 'Re-enter the code from your email'
	},
	[ERROR_CODES.AUTH_SIGNOUT_FAILED]: {
		title: "Couldn't sign out",
		message: "We'll try again. If you're stuck, close this window and open the site in a new tab.",
		userAction: 'Try again or close and reopen'
	},
	[ERROR_CODES.AUTH_SESSION_INVALID]: {
		title: 'Session expired',
		message: 'You were logged out. Log back in to continue.',
		userAction: 'Go back and log in again'
	},
	[ERROR_CODES.PAYMENT_HELCIM_HASH_INVALID]: {
		title: 'Payment verification failed',
		message: "We couldn't verify your payment. This is a security issue. Please contact support.",
		userAction: 'Contact support@IMPAVL.com with your transaction ID'
	},
	[ERROR_CODES.PAYMENT_HELCIM_API_ERROR]: {
		title: 'Payment system error',
		message: "We couldn't reach the payment system. Try again in a moment.",
		userAction: 'Retry or contact support if it continues'
	},
	[ERROR_CODES.PAYMENT_USER_CREATION_FAILED]: {
		title: 'Account creation failed',
		message: "We couldn't create your account. This account may already exist.",
		userAction: 'Use "Returning Users" to log in'
	},
	[ERROR_CODES.TICKET_NOT_FOUND]: {
		title: 'Ticket not found',
		message: 'No ticket found for that email. Make sure you entered the correct email.',
		userAction: 'Check your email address'
	},
	[ERROR_CODES.ACCESS_CODE_INVALID]: {
		title: 'Invalid access code',
		message: "That code doesn't exist or has been used. Contact support for a new code.",
		userAction: 'Contact support@IMPAVL.com'
	},
	[ERROR_CODES.ACCESS_CODE_ALREADY_USED]: {
		title: 'Code already used',
		message: 'That access code has already been redeemed. Contact support for a new one.',
		userAction: 'Contact support@IMPAVL.com'
	},
	[ERROR_CODES.STREAM_NOT_FOUND]: {
		title: 'Stream not ready',
		message: "The livestream isn't available yet. Check back in a moment.",
		userAction: 'Refresh the page'
	},
	[ERROR_CODES.STREAM_LOAD_TIMEOUT]: {
		title: 'Livestream took too long to load',
		message: "Something's slow. Try refreshing or check your internet connection.",
		userAction: 'Refresh the page'
	},
	[ERROR_CODES.MUX_LOAD_FAILED]: {
		title: 'Player failed to load',
		message: "We couldn't start the video player. Refresh and try again.",
		userAction: 'Refresh the page'
	},
	[ERROR_CODES.NETWORK_ERROR]: {
		title: 'Connection problem',
		message: 'Check your internet connection and try again.',
		userAction: 'Check your connection and refresh'
	},
	[ERROR_CODES.UNEXPECTED_ERROR]: {
		title: 'Something went wrong',
		message: 'An unexpected error occurred. Refresh the page and try again.',
		userAction: 'Refresh and retry'
	}
};

function createNotificationStore() {
	const { subscribe, set, update } = writable([]);

	return {
		subscribe,

		/**
		 * Add a notification
		 * @param {string} type - One of NOTIFICATION_TYPES
		 * @param {string} code - Error code (from ERROR_CODES) for diagnosis
		 * @param {object} overrides - Override message/title/duration
		 * @returns {string} notification ID
		 */
		add(type, code, overrides = {}) {
			const id = nanoid();
			// Errors require manual dismiss (duration: 0), others auto-dismiss after 4 seconds
			const duration = type === NOTIFICATION_TYPES.ERROR ? 0 : 4000;

			const message = ERROR_MESSAGES[code] || {
				title: 'Notification',
				message: 'Something happened',
				userAction: null
			};

			const notification = {
				id,
				type,
				code,
				...message,
				...overrides,
				duration: overrides.duration ?? duration,
				timestamp: Date.now()
			};

			update((notifications) => [...notifications, notification]);

			// Auto-remove after duration
			if (notification.duration > 0) {
				setTimeout(() => {
					this.remove(id);
				}, notification.duration);
			}

			return id;
		},

		/**
		 * Remove a notification
		 */
		remove(id) {
			update((notifications) => notifications.filter((n) => n.id !== id));
		},

		/**
		 * Clear all notifications
		 */
		clear() {
			set([]);
		},

		/**
		 * Helper: add error
		 */
		error(code, overrides) {
			return this.add(NOTIFICATION_TYPES.ERROR, code, overrides);
		},

		/**
		 * Helper: add success
		 */
		success(message, title = 'Success') {
			return this.add(NOTIFICATION_TYPES.SUCCESS, 'SUCCESS', {
				title,
				message,
				userAction: null
			});
		},

		/**
		 * Helper: add warning
		 */
		warning(message, title = 'Warning') {
			return this.add(NOTIFICATION_TYPES.WARNING, 'WARNING', {
				title,
				message,
				userAction: null
			});
		}
	};
}

export const notifications = createNotificationStore();
