import requests
import uuid

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Credentials for an existing test user with notes access (should be replaced with valid test user credentials)
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpassword"

def get_jwt_token(username, password):
    url = f"{BASE_URL}/api/token/"
    payload = {"username": username, "password": password}
    try:
        resp = requests.post(url, json=payload, timeout=TIMEOUT)
        resp.raise_for_status()
        tokens = resp.json()
        return tokens.get("access")
    except requests.RequestException as e:
        raise RuntimeError(f"Failed to obtain JWT token: {e}")

def test_notes_management_create_retrieve_delete():
    access_token = get_jwt_token(TEST_USERNAME, TEST_PASSWORD)
    headers = {"Authorization": f"Bearer {access_token}"}

    note_id = None
    try:
        # 1. Create a new note
        create_url = f"{BASE_URL}/api/notes/"
        unique_title = f"Test Note {uuid.uuid4()}"
        create_payload = {
            "title": unique_title,
            "content": "This is a test note content."
        }
        create_resp = requests.post(create_url, json=create_payload, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"Note creation failed: {create_resp.text}"
        created_note = create_resp.json()
        note_id = created_note.get("id")
        assert note_id is not None, "Created note ID is missing"

        # 2. Retrieve notes list and verify the created note is present
        list_url = f"{BASE_URL}/api/notes/"
        list_resp = requests.get(list_url, headers=headers, timeout=TIMEOUT)
        assert list_resp.status_code == 200, f"Failed to retrieve notes list: {list_resp.text}"
        notes_list = list_resp.json()
        assert any(note.get("id") == note_id and note.get("title") == unique_title for note in notes_list), \
            "Created note not found in notes list"

        # 3. Delete the created note by id
        delete_url = f"{BASE_URL}/api/notes/delete/{note_id}/"
        delete_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
        assert delete_resp.status_code == 204, f"Failed to delete note: {delete_resp.text}"

        # 4. Verify note is deleted by attempting to delete again (should return 404)
        delete_again_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
        assert delete_again_resp.status_code == 404, "Deleting non-existent note did not return 404"

        # 5. Verify note is no longer in the notes list
        list_resp_after_delete = requests.get(list_url, headers=headers, timeout=TIMEOUT)
        assert list_resp_after_delete.status_code == 200, f"Failed to retrieve notes list after delete: {list_resp_after_delete.text}"
        notes_list_after_delete = list_resp_after_delete.json()
        assert all(note.get("id") != note_id for note in notes_list_after_delete), "Deleted note still present in notes list"

    except AssertionError:
        raise
    except Exception as e:
        raise RuntimeError(f"Error during notes management test: {e}")

test_notes_management_create_retrieve_delete()
