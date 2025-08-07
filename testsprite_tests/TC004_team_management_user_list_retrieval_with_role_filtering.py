import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_team_management_user_list_retrieval_with_role_filtering():
    # Register a SweatPro user for authentication
    pro_register_data = {
        "username": "testpro_tc004",
        "password": "StrongPass!234",
        "password2": "StrongPass!234",
        "email": "testpro_tc004@example.com",
        "first_name": "Test",
        "last_name": "Pro",
        "profile": {
            "role": "PRO"
        }
    }
    # Register a SweatAthlete user for testing athlete list retrieval
    athlete_register_data = {
        "username": "testathlete_tc004",
        "password": "StrongPass!234",
        "password2": "StrongPass!234",
        "email": "testathlete_tc004@example.com",
        "first_name": "Test",
        "last_name": "Athlete",
        "profile": {
            "role": "ATHLETE"
        }
    }

    headers = {"Content-Type": "application/json"}

    try:
        # Register SweatPro user
        r = requests.post(f"{BASE_URL}/api/register/", json=pro_register_data, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 201, f"Failed to register SweatPro user: {r.text}"

        # Register SweatAthlete user
        r = requests.post(f"{BASE_URL}/api/register/", json=athlete_register_data, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 201, f"Failed to register SweatAthlete user: {r.text}"

        # Authenticate as SweatPro to get JWT token
        auth_data = {
            "username": pro_register_data["username"],
            "password": pro_register_data["password"]
        }
        r = requests.post(f"{BASE_URL}/api/token/", json=auth_data, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Failed to authenticate SweatPro user: {r.text}"
        tokens = r.json()
        access_token = tokens.get("access")
        assert access_token, "No access token received"

        auth_headers = {
            "Authorization": f"Bearer {access_token}"
        }

        # Retrieve full user list (team view)
        r = requests.get(f"{BASE_URL}/api/users/", headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Failed to retrieve full user list: {r.text}"
        users = r.json()
        assert isinstance(users, list), "Full user list response is not a list"
        # Check that both registered users are in the list by username
        usernames = [user.get("username") for user in users]
        assert pro_register_data["username"] in usernames, "SweatPro user not found in full user list"
        assert athlete_register_data["username"] in usernames, "SweatAthlete user not found in full user list"

        # Retrieve filtered list of athletes
        r = requests.get(f"{BASE_URL}/api/users/athletes/", headers=auth_headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Failed to retrieve athletes list: {r.text}"
        athletes = r.json()
        assert isinstance(athletes, list), "Athletes list response is not a list"
        # All returned users should have role ATHLETE
        for athlete in athletes:
            profile = athlete.get("profile", {})
            role = profile.get("role")
            assert role == "ATHLETE", f"Non-athlete user found in athletes list: {athlete}"

        # Authenticate as SweatAthlete to test role-based access control for athletes
        auth_data_athlete = {
            "username": athlete_register_data["username"],
            "password": athlete_register_data["password"]
        }
        r = requests.post(f"{BASE_URL}/api/token/", json=auth_data_athlete, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Failed to authenticate SweatAthlete user: {r.text}"
        tokens_athlete = r.json()
        access_token_athlete = tokens_athlete.get("access")
        assert access_token_athlete, "No access token received for athlete"

        auth_headers_athlete = {
            "Authorization": f"Bearer {access_token_athlete}"
        }

        # SweatAthlete tries to retrieve full user list - expect 403 or 200 depending on permissions
        r = requests.get(f"{BASE_URL}/api/users/", headers=auth_headers_athlete, timeout=TIMEOUT)
        # According to role-based access control, athletes may or may not have access.
        # We accept 200 or 403 but if 200, verify data structure
        assert r.status_code in (200, 403), f"Unexpected status code for athlete retrieving full user list: {r.status_code}"
        if r.status_code == 200:
            users_athlete = r.json()
            assert isinstance(users_athlete, list), "Athlete full user list response is not a list"

        # SweatAthlete tries to retrieve athletes list - expect 403 (insufficient permissions)
        r = requests.get(f"{BASE_URL}/api/users/athletes/", headers=auth_headers_athlete, timeout=TIMEOUT)
        assert r.status_code == 403, f"Expected 403 for athlete retrieving athletes list, got {r.status_code}"

    finally:
        # Cleanup: delete the created users if API supports user deletion (not specified in PRD)
        # Since no user deletion endpoint is specified, skipping cleanup.
        pass

test_team_management_user_list_retrieval_with_role_filtering()
