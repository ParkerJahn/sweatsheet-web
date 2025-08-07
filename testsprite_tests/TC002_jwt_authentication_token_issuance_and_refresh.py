import requests
import uuid

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_jwt_authentication_token_issuance_and_refresh():
    # Create a unique user for testing
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "TestPass123!"
    email = f"{username}@example.com"
    first_name = "Test"
    last_name = "User"
    role = "PRO"

    register_url = f"{BASE_URL}/api/register/"
    token_url = f"{BASE_URL}/api/token/"
    refresh_url = f"{BASE_URL}/api/token/refresh/"

    user_id = None

    try:
        # Register user
        register_payload = {
            "username": username,
            "password": password,
            "password2": password,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "profile": {
                "role": role
            }
        }
        r = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
        assert r.status_code == 201, f"User registration failed: {r.text}"

        # Obtain JWT tokens with valid credentials
        token_payload = {
            "username": username,
            "password": password
        }
        r = requests.post(token_url, json=token_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Token obtain failed with valid credentials: {r.text}"
        tokens = r.json()
        assert "access" in tokens and isinstance(tokens["access"], str) and tokens["access"], "Access token missing or invalid"
        assert "refresh" in tokens and isinstance(tokens["refresh"], str) and tokens["refresh"], "Refresh token missing or invalid"

        access_token = tokens["access"]
        refresh_token = tokens["refresh"]

        # Attempt to obtain tokens with invalid credentials
        invalid_token_payload = {
            "username": username,
            "password": "WrongPassword!"
        }
        r = requests.post(token_url, json=invalid_token_payload, timeout=TIMEOUT)
        assert r.status_code == 401, "Token obtain did not fail with invalid credentials"

        # Refresh access token with valid refresh token
        refresh_payload = {
            "refresh": refresh_token
        }
        r = requests.post(refresh_url, json=refresh_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Token refresh failed with valid refresh token: {r.text}"
        refreshed = r.json()
        assert "access" in refreshed and isinstance(refreshed["access"], str) and refreshed["access"], "Refreshed access token missing or invalid"

        # Refresh access token with invalid refresh token
        invalid_refresh_payload = {
            "refresh": "invalidtoken123"
        }
        r = requests.post(refresh_url, json=invalid_refresh_payload, timeout=TIMEOUT)
        assert r.status_code == 401, "Token refresh did not fail with invalid refresh token"

    finally:
        # Cleanup: delete the created user if possible
        # Since no delete user API is described, skip cleanup or implement if available
        pass

test_jwt_authentication_token_issuance_and_refresh()