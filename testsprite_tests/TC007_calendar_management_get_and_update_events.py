import requests
import uuid
import time

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Credentials for a test user (should exist in the system or be created beforehand)
TEST_USERNAME = "testuser_tc007"
TEST_PASSWORD = "TestPass123!"
TEST_EMAIL = "testuser_tc007@example.com"
TEST_FIRST_NAME = "Test"
TEST_LAST_NAME = "User"
TEST_ROLE = "ATHLETE"  # Assuming calendar events are per user, ATHLETE role is suitable

def register_user():
    url = f"{BASE_URL}/api/register/"
    payload = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD,
        "password2": TEST_PASSWORD,
        "email": TEST_EMAIL,
        "first_name": TEST_FIRST_NAME,
        "last_name": TEST_LAST_NAME,
        "profile": {
            "role": TEST_ROLE
        }
    }
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    if resp.status_code == 201:
        return True
    elif resp.status_code == 400 and "username" in resp.text:
        # User likely already exists
        return True
    else:
        resp.raise_for_status()

def get_jwt_token():
    url = f"{BASE_URL}/api/token/"
    payload = {
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    }
    resp = requests.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    tokens = resp.json()
    assert "access" in tokens and "refresh" in tokens
    return tokens["access"]

def test_calendar_management_get_and_update_events():
    # Ensure test user exists and get token
    register_user()
    token = get_jwt_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: GET current calendar events
    get_url = f"{BASE_URL}/api/calendar/"
    resp = requests.get(get_url, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200
    calendar_data = resp.json()
    assert "events" in calendar_data
    # events is an object with keys (e.g. dates) mapping to arrays of event objects
    events_obj = calendar_data["events"]
    assert isinstance(events_obj, dict)

    # Collect all events in a list for easier manipulation
    all_events = []
    for key, events_list in events_obj.items():
        assert isinstance(events_list, list)
        for event in events_list:
            # Validate event fields
            assert isinstance(event, dict)
            assert "id" in event and isinstance(event["id"], int)
            assert "time" in event and isinstance(event["time"], str)
            assert "title" in event and isinstance(event["title"], str)
            assert "type" in event and event["type"] in ["meeting", "availability"]
            assert "duration" in event and isinstance(event["duration"], int)
            all_events.append(event)

    # Prepare updated events payload
    # If no events exist, create a dummy event to update
    if not all_events:
        # Create a new availability event for today with a unique title
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%S")  # approximate current time ISO format without timezone
        new_event = {
            "id": 1,
            "time": now_iso,
            "title": f"Test Event {uuid.uuid4()}",
            "type": "availability",
            "duration": 60
        }
        updated_events = {time.strftime("%Y-%m-%d"): [new_event]}
    else:
        # Modify the title of the first event to a unique value
        updated_events = {}
        for key, events_list in events_obj.items():
            updated_events[key] = []
            for event in events_list:
                if event == all_events[0]:
                    event["title"] = f"Updated Title {uuid.uuid4()}"
                updated_events[key].append(event)

    # Step 2: PUT update calendar events
    put_url = f"{BASE_URL}/api/calendar/"
    put_payload = {"events": updated_events}
    put_resp = requests.put(put_url, headers=headers, json=put_payload, timeout=TIMEOUT)
    assert put_resp.status_code == 200

    # Step 3: GET calendar events again to verify update persisted
    verify_resp = requests.get(get_url, headers=headers, timeout=TIMEOUT)
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert "events" in verify_data
    verify_events_obj = verify_data["events"]
    assert isinstance(verify_events_obj, dict)

    # Check that the updated event title is present
    found_updated = False
    for key, events_list in verify_events_obj.items():
        for event in events_list:
            if event["id"] == (all_events[0]["id"] if all_events else 1):
                expected_title = updated_events[key][0]["title"] if all_events else updated_events[key][0]["title"]
                assert event["title"] == expected_title
                found_updated = True
                # Validate other fields remain consistent
                assert "time" in event and isinstance(event["time"], str)
                assert "type" in event and event["type"] in ["meeting", "availability"]
                assert "duration" in event and isinstance(event["duration"], int)
    assert found_updated, "Updated event not found in calendar after update."

test_calendar_management_get_and_update_events()
