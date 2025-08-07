import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

# Credentials for an existing user to authenticate and test the API
# These should be replaced with valid test user credentials in the environment
TEST_USERNAME = "testuser"
TEST_PASSWORD = "testpassword"


def test_workout_exercise_library_category_and_exercise_retrieval():
    # Authenticate to get JWT token
    token_url = f"{BASE_URL}/api/token/"
    auth_payload = {"username": TEST_USERNAME, "password": TEST_PASSWORD}
    try:
        auth_resp = requests.post(token_url, json=auth_payload, timeout=TIMEOUT)
        assert auth_resp.status_code == 200, f"Authentication failed: {auth_resp.text}"
        tokens = auth_resp.json()
        access_token = tokens.get("access")
        assert access_token, "Access token not found in response"
    except requests.RequestException as e:
        assert False, f"Authentication request failed: {e}"

    headers = {"Authorization": f"Bearer {access_token}"}

    # 1. Retrieve all workout categories
    categories_url = f"{BASE_URL}/api/workout-categories/"
    try:
        categories_resp = requests.get(categories_url, headers=headers, timeout=TIMEOUT)
        assert categories_resp.status_code == 200, f"Failed to get workout categories: {categories_resp.text}"
        categories = categories_resp.json()
        assert isinstance(categories, list), "Categories response is not a list"
        for category in categories:
            assert isinstance(category, dict), "Category item is not a dict"
            assert "id" in category and isinstance(category["id"], int), "Category missing valid 'id'"
            assert "name" in category and isinstance(category["name"], str), "Category missing valid 'name'"
            assert "description" in category and isinstance(category["description"], str), "Category missing valid 'description'"
    except requests.RequestException as e:
        assert False, f"Workout categories request failed: {e}"

    # 2. For each category, retrieve workout exercises filtered by category_id
    exercises_url = f"{BASE_URL}/api/workout-exercises/"
    for category in categories:
        params = {"category_id": category["id"]}
        try:
            exercises_resp = requests.get(exercises_url, headers=headers, params=params, timeout=TIMEOUT)
            assert exercises_resp.status_code == 200, f"Failed to get exercises for category {category['id']}: {exercises_resp.text}"
            exercises = exercises_resp.json()
            assert isinstance(exercises, list), "Exercises response is not a list"
            for exercise in exercises:
                assert isinstance(exercise, dict), "Exercise item is not a dict"
                assert "id" in exercise and isinstance(exercise["id"], int), "Exercise missing valid 'id'"
                assert "name" in exercise and isinstance(exercise["name"], str), "Exercise missing valid 'name'"
                assert "description" in exercise and isinstance(exercise["description"], str), "Exercise missing valid 'description'"
                assert "category" in exercise and exercise["category"] == category["id"], "Exercise category mismatch"
        except requests.RequestException as e:
            assert False, f"Workout exercises request failed for category {category['id']}: {e}"

    # 3. Test security enforcement: try to access categories without token
    try:
        no_auth_resp = requests.get(categories_url, timeout=TIMEOUT)
        assert no_auth_resp.status_code == 401, "Unauthorized access to workout categories did not return 401"
    except requests.RequestException as e:
        assert False, f"Unauthorized workout categories request failed: {e}"

    # 4. Test security enforcement: try to access exercises without token
    try:
        no_auth_resp = requests.get(exercises_url, timeout=TIMEOUT)
        assert no_auth_resp.status_code == 401, "Unauthorized access to workout exercises did not return 401"
    except requests.RequestException as e:
        assert False, f"Unauthorized workout exercises request failed: {e}"


test_workout_exercise_library_category_and_exercise_retrieval()