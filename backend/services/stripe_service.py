import stripe
import os
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

# Pricing IDs from Env
STRIPE_PRO_PRICE_ID = os.getenv("STRIPE_PRO_PRICE_ID", "price_pro_placeholder")
STRIPE_ELITE_PRICE_ID = os.getenv("STRIPE_ELITE_PRICE_ID", "price_elite_placeholder")

def create_subscription_session(user_id: str, tier: str):
    """Creates a Stripe Checkout Session for a recurring subscription."""
    if tier == "pro":
        price_id = STRIPE_PRO_PRICE_ID
    elif tier == "elite":
        price_id = STRIPE_ELITE_PRICE_ID
    else:
        raise ValueError(f"Invalid subscription tier for Stripe: {tier}")

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            metadata={'user_id': user_id, 'tier': tier},
            success_url=f"{FRONTEND_URL}/subscription?success=true",
            cancel_url=f"{FRONTEND_URL}/subscription?canceled=true",
        )
        return session.url
    except Exception as e:
        print(f"Error creating subscription session: {e}")
        return None

def create_checkout_session(user_id: str):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': 'WhaleSync Copy Slot',
                        'description': 'One additional slot to copy follow market wallets/profiles',
                    },
                    'unit_amount': 500, # $5.00
                },
                'quantity': 1,
            }],
            mode='payment',
            metadata={'user_id': user_id},
            success_url=f"{FRONTEND_URL}/settings?success=true",
            cancel_url=f"{FRONTEND_URL}/settings?canceled=true",
        )
        return session.url
    except Exception as e:
        print(f"Error creating stripe session: {e}")
        return None

def verify_webhook(payload, sig_header):
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
        return event
    except Exception as e:
        print(f"Webhook signature verification failed: {e}")
        return None
