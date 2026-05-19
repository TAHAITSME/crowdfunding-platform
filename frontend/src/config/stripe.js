import { loadStripe } from '@stripe/stripe-js'

// Remplace par ta vraie clé publique Stripe
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...'
)
