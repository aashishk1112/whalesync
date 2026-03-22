from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from services.dynamodb_service import get_user_by_email, create_user
from services.jwt_service import create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests

router = APIRouter()

import os

# You would normally inject this from env:
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com")

class GoogleLogin(BaseModel):
    credential: str
    referral_code: Optional[str] = None

@router.post("/mock")
def mock_auth(data: dict):
    """Bypass Google auth for local E2E testing."""
    email = data.get("email", "test_whale@whalesync.com")
    username = data.get("username", "Test Whale")
    picture = "https://lh3.googleusercontent.com/a/ACg8ocL-X"
    
    db_user = get_user_by_email(email)
    if not db_user:
        db_user = create_user(email, username, picture)
    
    token = create_access_token(data={"sub": db_user['userId'], "username": db_user.get('username', 'User')})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": db_user['userId'],
            "username": db_user.get('username', 'User'),
            "email": db_user['email'],
            "subscription_tier": db_user.get('subscription_tier', 'free'),
            "simulation_capital": float(db_user.get('simulation_capital', 10000.0))
        }
    }

@router.post("/google")
def google_auth(data: GoogleLogin):
    try:
        # Verify the token with Google
        # For local testing, we might need to bypass verification if we don't have a real client_id
        # but the code below is the correct production specification:
        idinfo = id_token.verify_oauth2_token(data.credential, requests.Request(), GOOGLE_CLIENT_ID)
        
        # Or, if we are purely mocking for local test without a real Google App setup:
        # idinfo = {"email": "user@example.com", "name": "Google User", "sub": "12345"}
        
        email = idinfo['email']
        # Use given_name for first name, fallback to full name or 'User'
        first_name = idinfo.get('given_name') or idinfo.get('name', 'User')
        picture = idinfo.get('picture')

        db_user = get_user_by_email(email)
        
        if not db_user:
            # Auto-register if user doesn't exist
            db_user = create_user(email, first_name, picture, data.referral_code)
        else:
            # Update name/picture if missing or default 'User'
            updates = {}
            if first_name and (not db_user.get("username") or db_user.get("username") == "User"):
                updates["username"] = first_name
            if picture and db_user.get("picture_url") != picture:
                updates["picture_url"] = picture
                
            if updates:
                from services.dynamodb_service import users_table
                update_expr = "SET " + ", ".join([f"{k} = :{k}" for k in updates.keys()])
                attr_vals = {f":{k}": v for k, v in updates.items()}
                users_table.update_item(
                    Key={"userId": db_user["userId"]},
                    UpdateExpression=update_expr,
                    ExpressionAttributeValues=attr_vals
                )
                db_user.update(updates)
            
        token = create_access_token(data={"sub": db_user['user_id'], "username": db_user.get('username', 'User')})
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "user": {
                "user_id": db_user['user_id'], 
                "username": db_user.get('username', 'User'), 
                "email": db_user['email'],
                "picture_url": db_user.get('picture_url'),
                "referral_code": db_user.get('referral_code'),
                "subscription_tier": db_user.get('subscription_tier', 'free'),
                "source_slots": int(db_user.get('source_slots', 0)),
                "simulation_capital": float(db_user.get('simulation_capital', 0)),
                "bonus_slots": int(db_user.get('bonus_slots', 0)),
                "bonus_capital": float(db_user.get('bonus_capital', 0))
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {str(e)}")

@router.get("/me")
def get_me(token: str):
    from services.jwt_service import decode_access_token
    from services.dynamodb_service import get_user_by_id
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user_by_id(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"user": {
        "user_id": user["user_id"],
        "email": user["email"],
        "username": user.get("username", "User"),
        "picture_url": user.get("picture_url"),
        "referral_code": user.get("referral_code"),
        "subscription_tier": user.get("subscription_tier", "free"),
        "source_slots": int(user.get("source_slots", 0)),
        "simulation_capital": float(user.get("simulation_capital", 0)),
        "bonus_slots": int(user.get("bonus_slots", 0)),
        "bonus_capital": float(user.get("bonus_capital", 0))
    }}
