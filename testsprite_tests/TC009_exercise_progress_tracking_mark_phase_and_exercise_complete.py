import requests
import random
import string
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Helper functions for user registration and login
def random_string(length=8):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def register_user(username, password, email, first_name, last_name, role):
    url = f"{BASE_URL}/api/register/"
    payload = {
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
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp

def get_jwt_token(username, password):
    url = f"{BASE_URL}/api/token/"
    payload = {"username": username, "password": password}
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    tokens = resp.json()
    return tokens["access"], tokens.get("refresh")

def create_sweatsheet(access_token, title="Test SweatSheet"):
    url = f"{BASE_URL}/api/sweatsheets/"
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"title": title}
    resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def get_sweatsheet_details(access_token, sweatsheet_id):
    url = f"{BASE_URL}/api/sweatsheets/{sweatsheet_id}/"
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(url, headers=headers, timeout=TIMEOUT)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()

def delete_sweatsheet(access_token, sweatsheet_id):
    # No delete endpoint documented for sweatsheets, so skip deletion
    pass

def find_first_phase_and_exercise(sweatsheet):
    # The PRD shows phases as array, but no detailed schema for phases or exercises.
    # We assume phases have id and exercises array with id.
    phases = sweatsheet.get("phases", [])
    for phase in phases:
        phase_id = phase.get("id")
        exercises = phase.get("exercises", [])
        for exercise in exercises:
            exercise_id = exercise.get("id")
            if phase_id and exercise_id:
                return phase_id, exercise_id
    return None, None

def mark_phase_complete(access_token, phase_id):
    url = f"{BASE_URL}/api/phases/{phase_id}/complete/"
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.post(url, headers=headers, timeout=TIMEOUT)
    return resp

def mark_exercise_complete(access_token, exercise_id):
    url = f"{BASE_URL}/api/exercises/{exercise_id}/complete/"
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.post(url, headers=headers, timeout=TIMEOUT)
    return resp

def test_exercise_progress_tracking_mark_phase_and_exercise_complete():
    # Register a new athlete user
    username = f"athlete_{random_string(6)}"
    password = "TestPass123!"
    email = f"{username}@example.com"
    first_name = "Test"
    last_name = "Athlete"
    role = "ATHLETE"

    register_user(username, password, email, first_name, last_name, role)

    access_token, _ = get_jwt_token(username, password)
    headers = {"Authorization": f"Bearer {access_token}"}

    # Create a SweatSheet as a SweatPro to have phases and exercises to mark complete
    # Register and login a SweatPro user
    pro_username = f"pro_{random_string(6)}"
    pro_password = "ProPass123!"
    pro_email = f"{pro_username}@example.com"
    pro_first_name = "Test"
    pro_last_name = "Pro"
    pro_role = "PRO"

    register_user(pro_username, pro_password, pro_email, pro_first_name, pro_last_name, pro_role)
    pro_access_token, _ = get_jwt_token(pro_username, pro_password)

    # Create a SweatSheet with phases and exercises
    # Since the PRD does not specify how to add phases/exercises in creation,
    # we create a basic SweatSheet and then try to get phases/exercises from it.
    sweatsheet = create_sweatsheet(pro_access_token, title="Progress Tracking Test Sheet")

    sweatsheet_id = sweatsheet.get("id")
    assert sweatsheet_id is not None, "Failed to create SweatSheet"

    # For testing, we need phases and exercises.
    # If none exist, we cannot proceed with marking complete.
    # So we try to get details and check phases.
    sweatsheet_details = get_sweatsheet_details(pro_access_token, sweatsheet_id)
    assert sweatsheet_details is not None, "SweatSheet details not found"

    # If no phases or exercises, we cannot test marking complete.
    # So we skip test if none found.
    phase_id, exercise_id = find_first_phase_and_exercise(sweatsheet_details)

    if phase_id is None or exercise_id is None:
        # Cannot test marking complete without phase and exercise ids
        # So we skip the marking complete tests but still test error handling with invalid ids
        phase_id = 9999999  # Non-existent phase id
        exercise_id = 9999999  # Non-existent exercise id
    else:
        # Mark phase as complete - success case
        resp_phase = mark_phase_complete(access_token, phase_id)
        assert resp_phase.status_code == 200, f"Failed to mark phase complete: {resp_phase.text}"

        # Mark exercise as complete - success case
        resp_exercise = mark_exercise_complete(access_token, exercise_id)
        assert resp_exercise.status_code == 200, f"Failed to mark exercise complete: {resp_exercise.text}"

    # Test marking non-existent phase as complete - expect 404
    invalid_phase_id = 9999999
    resp_invalid_phase = mark_phase_complete(access_token, invalid_phase_id)
    assert resp_invalid_phase.status_code == 404, "Expected 404 for non-existent phase id"

    # Test marking non-existent exercise as complete - expect 404
    invalid_exercise_id = 9999999
    resp_invalid_exercise = mark_exercise_complete(access_token, invalid_exercise_id)
    assert resp_invalid_exercise.status_code == 404, "Expected 404 for non-existent exercise id"

    # Test marking phase complete without auth - expect 401
    url_phase = f"{BASE_URL}/api/phases/{phase_id}/complete/"
    resp_no_auth_phase = requests.post(url_phase, timeout=TIMEOUT)
    assert resp_no_auth_phase.status_code == 401, "Expected 401 Unauthorized for phase complete without auth"

    # Test marking exercise complete without auth - expect 401
    url_exercise = f"{BASE_URL}/api/exercises/{exercise_id}/complete/"
    resp_no_auth_exercise = requests.post(url_exercise, timeout=TIMEOUT)
    assert resp_no_auth_exercise.status_code == 401, "Expected 401 Unauthorized for exercise complete without auth"

test_exercise_progress_tracking_mark_phase_and_exercise_complete()