import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_profile_management_view_and_update():
    # Test user credentials and registration data
    register_url = f"{BASE_URL}/api/register/"
    token_url = f"{BASE_URL}/api/token/"
    profile_url = f"{BASE_URL}/api/profile/"

    user_data = {
        "username": "testuser_tc003",
        "password": "StrongPass!123",
        "password2": "StrongPass!123",
        "email": "testuser_tc003@example.com",
        "first_name": "Test",
        "last_name": "User",
        "profile": {
            "phone_number": "1234567890",
            "role": "PRO"
        }
    }

    updated_profile_data_valid = {
        "first_name": "UpdatedFirst",
        "last_name": "UpdatedLast",
        "email": "updated_email_tc003@example.com",
        "phone_number": "0987654321"
    }

    updated_profile_data_invalid_email = {
        "email": "invalid-email-format"
    }

    headers = {"Content-Type": "application/json"}

    # Register user
    try:
        r = requests.post(register_url, json=user_data, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 201, f"User registration failed: {r.status_code} {r.text}"
    except Exception as e:
        raise AssertionError(f"User registration request failed: {e}")

    # Obtain JWT token
    token_payload = {
        "username": user_data["username"],
        "password": user_data["password"]
    }
    try:
        r = requests.post(token_url, json=token_payload, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Token obtain failed: {r.status_code} {r.text}"
        tokens = r.json()
        access_token = tokens.get("access")
        assert access_token, "Access token missing in response"
    except Exception as e:
        raise AssertionError(f"Token obtain request failed: {e}")

    auth_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Retrieve profile (GET)
    try:
        r = requests.get(profile_url, headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Profile retrieval failed: {r.status_code} {r.text}"
        profile = r.json()
        # Validate returned fields
        assert profile.get("username") == user_data["username"]
        assert profile.get("first_name") == user_data["first_name"]
        assert profile.get("last_name") == user_data["last_name"]
        assert profile.get("email") == user_data["email"]
        profile_obj = profile.get("profile", {})
        assert profile_obj.get("role") == user_data["profile"]["role"]
        assert profile_obj.get("phone_number") == user_data["profile"]["phone_number"]
    except Exception as e:
        raise AssertionError(f"Profile retrieval request failed: {e}")

    # Update profile with valid data (PATCH)
    try:
        r = requests.patch(profile_url, json=updated_profile_data_valid, headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Profile update failed: {r.status_code} {r.text}"
    except Exception as e:
        raise AssertionError(f"Profile update request failed: {e}")

    # Verify updated profile fields
    try:
        r = requests.get(profile_url, headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Profile retrieval after update failed: {r.status_code} {r.text}"
        profile = r.json()
        assert profile.get("first_name") == updated_profile_data_valid["first_name"]
        assert profile.get("last_name") == updated_profile_data_valid["last_name"]
        assert profile.get("email") == updated_profile_data_valid["email"]
        profile_obj = profile.get("profile", {})
        assert profile_obj.get("phone_number") == updated_profile_data_valid["phone_number"]
    except Exception as e:
        raise AssertionError(f"Profile retrieval after update request failed: {e}")

    # Attempt update with invalid email to test validation error (PATCH)
    try:
        r = requests.patch(profile_url, json=updated_profile_data_invalid_email, headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 400, f"Invalid email update should fail with 400, got {r.status_code}"
    except Exception as e:
        raise AssertionError(f"Invalid email update request failed: {e}")

    # Verify role-based permission: try to update role field (should not be allowed or ignored)
    # Since role is not in update schema, test that role cannot be changed by patching profile.role
    # Attempt to patch role via profile object (should be ignored or rejected)
    invalid_role_update = {
        "role": "ATHLETE"
    }
    try:
        r = requests.patch(profile_url, json=invalid_role_update, headers=auth_headers, timeout=TIMEOUT)
        # The API schema does not allow role update via this endpoint, so expect either 200 with no change or 400
        if r.status_code == 200:
            # Confirm role unchanged
            r2 = requests.get(profile_url, headers=auth_headers, timeout=TIMEOUT)
            assert r2.status_code == 200, f"Profile retrieval failed: {r2.status_code} {r2.text}"
            profile = r2.json()
            profile_obj = profile.get("profile", {})
            assert profile_obj.get("role") == user_data["profile"]["role"], "Role should not be changed by patch"
        else:
            assert r.status_code == 400, f"Unexpected status code for role update attempt: {r.status_code}"
    except Exception as e:
        raise AssertionError(f"Role update attempt request failed: {e}")

    # Cleanup: delete the created user if API supports it (not specified in PRD)
    # No delete user endpoint specified, so skipping cleanup

test_profile_management_view_and_update()