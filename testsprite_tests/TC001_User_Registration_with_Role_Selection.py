import requests
import uuid

BASE_URL = "http://localhost:8000"
REGISTER_ENDPOINT = f"{BASE_URL}/api/register/"
TIMEOUT = 30

def test_user_registration_with_role_selection():
    headers = {"Content-Type": "application/json"}
    roles = ["PRO", "ATHLETE", "SWEAT_TEAM_MEMBER"]

    # Test successful registration for each role
    for role in roles:
        unique_suffix = str(uuid.uuid4())[:8]
        payload = {
            "username": f"user_{role.lower()}_{unique_suffix}",
            "password": "StrongPass!123",
            "password2": "StrongPass!123",
            "email": f"{role.lower()}_{unique_suffix}@example.com",
            "first_name": f"First{role}",
            "last_name": f"Last{role}",
            "profile": {
                "role": role
            }
        }
        try:
            response = requests.post(REGISTER_ENDPOINT, json=payload, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed for role {role}: {e}"

        assert response.status_code == 201, f"Expected 201 Created for role {role}, got {response.status_code}"

    # Test validation error: missing required fields
    invalid_payloads = [
        # Missing username
        {
            "password": "StrongPass!123",
            "password2": "StrongPass!123",
            "email": "invalid@example.com",
            "first_name": "First",
            "last_name": "Last",
            "profile": {"role": "PRO"}
        },
        # Passwords do not match
        {
            "username": "user_invalid_pw",
            "password": "StrongPass!123",
            "password2": "WrongPass!123",
            "email": "invalidpw@example.com",
            "first_name": "First",
            "last_name": "Last",
            "profile": {"role": "ATHLETE"}
        },
        # Invalid email format
        {
            "username": "user_invalid_email",
            "password": "StrongPass!123",
            "password2": "StrongPass!123",
            "email": "not-an-email",
            "first_name": "First",
            "last_name": "Last",
            "profile": {"role": "SWEAT_TEAM_MEMBER"}
        },
        # Invalid role
        {
            "username": "user_invalid_role",
            "password": "StrongPass!123",
            "password2": "StrongPass!123",
            "email": "valid@example.com",
            "first_name": "First",
            "last_name": "Last",
            "profile": {"role": "INVALID_ROLE"}
        }
    ]

    for idx, invalid_payload in enumerate(invalid_payloads, start=1):
        try:
            response = requests.post(REGISTER_ENDPOINT, json=invalid_payload, headers=headers, timeout=TIMEOUT)
        except requests.RequestException as e:
            assert False, f"Request failed for invalid payload #{idx}: {e}"

        assert response.status_code == 400, f"Expected 400 Bad Request for invalid payload #{idx}, got {response.status_code}"

test_user_registration_with_role_selection()