import requests
import uuid

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_sweatsheet_management_create_list_and_assign():
    # Helper functions
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

    def get_token(username, password):
        url = f"{BASE_URL}/api/token/"
        payload = {"username": username, "password": password}
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        tokens = resp.json()
        assert "access" in tokens and "refresh" in tokens
        return tokens["access"]

    def create_sweatsheet(token, title, description=None, is_template=False):
        url = f"{BASE_URL}/api/sweatsheets/"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"title": title, "is_template": is_template}
        if description is not None:
            payload["description"] = description
        resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        return resp

    def list_sweatsheets(token):
        url = f"{BASE_URL}/api/sweatsheets/"
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        return resp

    def get_sweatsheet_details(token, sweatsheet_id):
        url = f"{BASE_URL}/api/sweatsheets/{sweatsheet_id}/"
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        return resp

    def assign_sweatsheet(token, sweatsheet_id, athlete_ids):
        url = f"{BASE_URL}/api/sweatsheets/{sweatsheet_id}/assign/"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {"athletes": athlete_ids}
        resp = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        return resp

    def get_athletes(token):
        url = f"{BASE_URL}/api/users/athletes/"
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        return resp

    def delete_sweatsheet(token, sweatsheet_id):
        # No explicit delete endpoint in PRD for sweatsheets, so skip deletion
        # If needed, implement here
        pass

    # Register a SweatPro user
    pro_username = f"pro_{uuid.uuid4().hex[:8]}"
    pro_password = "StrongPass!123"
    pro_email = f"{pro_username}@example.com"
    pro_first_name = "ProFirst"
    pro_last_name = "ProLast"
    pro_role = "PRO"

    resp = register_user(pro_username, pro_password, pro_email, pro_first_name, pro_last_name, pro_role)
    assert resp.status_code == 201

    pro_token = get_token(pro_username, pro_password)

    # Register an athlete user to assign sweatSheet to
    athlete_username = f"athlete_{uuid.uuid4().hex[:8]}"
    athlete_password = "StrongPass!123"
    athlete_email = f"{athlete_username}@example.com"
    athlete_first_name = "AthleteFirst"
    athlete_last_name = "AthleteLast"
    athlete_role = "ATHLETE"

    resp = register_user(athlete_username, athlete_password, athlete_email, athlete_first_name, athlete_last_name, athlete_role)
    assert resp.status_code == 201

    athlete_token = get_token(athlete_username, athlete_password)

    # Get athlete user id from /api/users/athletes/ endpoint (to confirm athlete id)
    resp = get_athletes(pro_token)
    assert resp.status_code == 200
    athletes_list = resp.json()
    athlete_ids = [a["id"] for a in athletes_list if a["username"] == athlete_username]
    assert len(athlete_ids) == 1
    athlete_id = athlete_ids[0]

    # Create a new SweatSheet as SweatPro
    sweatsheet_title = f"Test SweatSheet {uuid.uuid4().hex[:6]}"
    sweatsheet_description = "Test description for SweatSheet"
    resp = create_sweatsheet(pro_token, sweatsheet_title, sweatsheet_description, is_template=False)
    assert resp.status_code == 201
    sweatsheet = resp.json()
    assert "id" in sweatsheet
    sweatsheet_id = sweatsheet["id"]

    try:
        # List SweatSheets as SweatPro and verify the created one is present
        resp = list_sweatsheets(pro_token)
        assert resp.status_code == 200
        sheets = resp.json()
        assert any(s["id"] == sweatsheet_id and s["title"] == sweatsheet_title for s in sheets)

        # Retrieve details of the specific SweatSheet
        resp = get_sweatsheet_details(pro_token, sweatsheet_id)
        assert resp.status_code == 200
        details = resp.json()
        assert details["id"] == sweatsheet_id
        assert details["title"] == sweatsheet_title
        assert details.get("description") == sweatsheet_description

        # Assign the SweatSheet to the athlete
        resp = assign_sweatsheet(pro_token, sweatsheet_id, [athlete_id])
        assert resp.status_code == 200

        # Verify athlete cannot create a SweatSheet (permission check)
        resp = create_sweatsheet(athlete_token, "Athlete Sheet")
        assert resp.status_code == 403

        # Verify athlete can list their assigned SweatSheets (should include the assigned one)
        resp = list_sweatsheets(athlete_token)
        assert resp.status_code == 200
        athlete_sheets = resp.json()
        assert any(s["id"] == sweatsheet_id for s in athlete_sheets)

        # Verify athlete can get details of assigned SweatSheet
        resp = get_sweatsheet_details(athlete_token, sweatsheet_id)
        assert resp.status_code == 200
        athlete_sheet_details = resp.json()
        assert athlete_sheet_details["id"] == sweatsheet_id

        # Verify permission denied when non-Pro tries to assign SweatSheet
        resp = assign_sweatsheet(athlete_token, sweatsheet_id, [athlete_id])
        assert resp.status_code == 403

    finally:
        # Cleanup: No delete endpoint for sweatsheets specified, so skipping deletion
        pass

test_sweatsheet_management_create_list_and_assign()