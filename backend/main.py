from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from dotenv import load_dotenv
import os

load_dotenv()

from services.secrets_service import load_secrets
load_secrets()

from routes import auth, markets, traders, signals, strategies, portfolio
from services.stripe_service import verify_webhook
from services.dynamodb_service import add_user_slot
import stripe

app = FastAPI(title="WhaleSync API", version="1.0.0")

# Setup CORS - Permissive for local development to bypass browser strictness
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Must be False for allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler to ensure CORS headers are present even on crashes
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print(f"GLOBAL ERROR: {str(exc)}")
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

# Root path
@app.get("/")
def read_root():
    return {"status": "ok", "message": "Whalesync Backend Running"}

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(markets.router, prefix="/api/markets", tags=["markets"])
app.include_router(traders.router, prefix="/api/traders", tags=["traders"])
app.include_router(signals.router, prefix="/api/signals", tags=["signals"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["strategies"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    # We always verify signature, but we log the attempt more clearly
    event = verify_webhook(payload, sig_header)
    if not event:
        print("WEBHOOK ERROR: Invalid signature or missing secret")
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    print(f"WEBHOOK RECEIVED: {event.get('type')}")
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('metadata', {}).get('user_id')
        print(f"CHECKOUT COMPLETED: user_id={user_id}")
        
        if user_id:
            try:
                add_user_slot(user_id)
                print(f"SUCCESS: Added slot for user {user_id}")
            except Exception as e:
                print(f"FAILURE: Could not add slot for {user_id}: {str(e)}")
        else:
            print("WEBHOOK WARNING: No user_id found in session metadata")
            
    return {"status": "success"}

# Wrap with Mangum for AWS Lambda compatibility
handler = Mangum(app)
