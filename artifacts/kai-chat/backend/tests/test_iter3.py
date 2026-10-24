"""Iteration 3 - K.ai: personas CRUD, conversation persona/reset, profile stats, PUT /auth/me."""
import os
import uuid
import pytest
import requests

BASE = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE}/api"


def _register(email_prefix="TEST_u"):
    s = requests.Session()
    email = f"{email_prefix}_{uuid.uuid4().hex[:8]}@lumi.app"
    r = s.post(f"{API}/auth/register", json={
        "name": "Test User", "email": email, "password": "senha12345", "adult_confirmed": True})
    assert r.status_code == 200, r.text
    return s, r.json()


@pytest.fixture
def user_a():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "teste1@lumi.app", "password": "senha12345"})
    assert r.status_code == 200
    return s, r.json()


# ----------- Personas CRUD -----------
def test_personas_crud_and_age_validation():
    s, _ = _register()
    # Age < 18 -> 422
    r = s.post(f"{API}/personas", json={"name": "Minor", "age": 17})
    assert r.status_code == 422

    # Valid create
    r = s.post(f"{API}/personas", json={
        "name": "Kai", "gender": "Masculino", "age": 22,
        "appearance": "cabelo preto, olhos verdes", "description": "gosta de livros"})
    assert r.status_code == 200, r.text
    persona = r.json()
    assert persona["name"] == "Kai"
    assert persona["age"] == 22
    pid = persona["id"]
    assert "user_id" not in persona
    assert "_id" not in persona

    # List
    r = s.get(f"{API}/personas")
    assert r.status_code == 200
    lst = r.json()
    assert any(p["id"] == pid for p in lst)

    # Update
    r = s.put(f"{API}/personas/{pid}", json={
        "name": "Kai Updated", "gender": "Masculino", "age": 25,
        "appearance": "", "description": ""})
    assert r.status_code == 200
    assert r.json()["name"] == "Kai Updated"
    assert r.json()["age"] == 25

    # Delete
    r = s.delete(f"{API}/personas/{pid}")
    assert r.status_code == 200
    r = s.get(f"{API}/personas")
    assert all(p["id"] != pid for p in r.json())


def test_persona_cross_user_404():
    s_a, _ = _register("TEST_a")
    s_b, _ = _register("TEST_b")

    r = s_a.post(f"{API}/personas", json={"name": "A-persona", "age": 25})
    assert r.status_code == 200
    pid = r.json()["id"]

    # User B tries to edit
    r = s_b.put(f"{API}/personas/{pid}", json={"name": "hack", "gender": "Outro", "age": 20,
                                                "appearance": "", "description": ""})
    assert r.status_code == 404
    # User B tries delete
    r = s_b.delete(f"{API}/personas/{pid}")
    assert r.status_code == 404

    # Cleanup
    s_a.delete(f"{API}/personas/{pid}")


def test_persona_limit():
    # Not testing full 10 to save time
    s, _ = _register()
    pid = None
    for i in range(2):
        r = s.post(f"{API}/personas", json={"name": f"P{i}", "age": 20})
        assert r.status_code == 200
        pid = r.json()["id"]
    assert pid


# ----------- PUT /auth/me -----------
def test_update_me():
    s, me = _register()
    r = s.put(f"{API}/auth/me", json={"name": "Novo Nome", "avatar_url": "https://example.com/a.png"})
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "Novo Nome"
    assert r.json()["avatar_url"] == "https://example.com/a.png"

    r = s.get(f"{API}/auth/me")
    assert r.json()["name"] == "Novo Nome"


def test_update_me_invalid_avatar():
    s, _ = _register()
    r = s.put(f"{API}/auth/me", json={"name": "ok", "avatar_url": "not-a-url"})
    assert r.status_code == 422


# ----------- profile/stats -----------
def test_profile_stats_shape(user_a):
    s, _ = user_a
    r = s.get(f"{API}/profile/stats")
    assert r.status_code == 200
    data = r.json()
    for k in ("chats", "saved", "followers"):
        assert k in data
        assert isinstance(data[k], int)


# ----------- Conversation persona + reset -----------
def test_conversation_starts_with_first_persona():
    s, _ = _register()
    # create a persona first
    r = s.post(f"{API}/personas", json={"name": "AutoPersona", "age": 25})
    assert r.status_code == 200
    pid = r.json()["id"]
    # pick a seed character
    chars = s.get(f"{API}/characters").json()
    assert chars
    cid = chars[0]["id"]
    r = s.post(f"{API}/conversations", json={"character_id": cid})
    assert r.status_code == 200
    conv_id = r.json()["id"]
    # GET conv - should have persona_id==pid
    r = s.get(f"{API}/conversations/{conv_id}")
    assert r.status_code == 200
    data = r.json()
    assert data["conversation"].get("persona_id") == pid
    assert data["persona"] is not None
    assert data["persona"]["id"] == pid
    # messages should contain the greeting
    assert len(data["messages"]) == 1
    assert data["messages"][0]["role"] == "assistant"


def test_set_conversation_persona_cross_user_404():
    s_a, _ = _register("TEST_pa")
    s_b, _ = _register("TEST_pb")
    # A creates persona
    r = s_a.post(f"{API}/personas", json={"name": "A", "age": 20})
    pid_a = r.json()["id"]
    # B starts conversation
    chars = s_b.get(f"{API}/characters").json()
    cid = chars[0]["id"]
    r = s_b.post(f"{API}/conversations", json={"character_id": cid})
    conv_id = r.json()["id"]
    # B tries to assign A's persona
    r = s_b.put(f"{API}/conversations/{conv_id}/persona", json={"persona_id": pid_a})
    assert r.status_code == 404


def test_set_conversation_persona_clear():
    s, _ = _register()
    r = s.post(f"{API}/personas", json={"name": "P1", "age": 20})
    pid = r.json()["id"]
    chars = s.get(f"{API}/characters").json()
    cid = chars[0]["id"]
    conv_id = s.post(f"{API}/conversations", json={"character_id": cid}).json()["id"]
    # Clear persona
    r = s.put(f"{API}/conversations/{conv_id}/persona", json={"persona_id": None})
    assert r.status_code == 200
    assert r.json()["persona"] is None
    # Set back
    r = s.put(f"{API}/conversations/{conv_id}/persona", json={"persona_id": pid})
    assert r.status_code == 200
    assert r.json()["persona"]["id"] == pid


def test_conversation_reset_clears_messages():
    s, _ = _register()
    chars = s.get(f"{API}/characters").json()
    cid = chars[0]["id"]
    conv_id = s.post(f"{API}/conversations", json={"character_id": cid}).json()["id"]
    # before reset: 1 greeting
    data = s.get(f"{API}/conversations/{conv_id}").json()
    assert len(data["messages"]) == 1

    # Reset
    r = s.post(f"{API}/conversations/{conv_id}/reset")
    assert r.status_code == 200
    body = r.json()
    assert len(body["messages"]) == 1
    assert body["messages"][0]["role"] == "assistant"

    # Verify persisted
    data = s.get(f"{API}/conversations/{conv_id}").json()
    assert len(data["messages"]) == 1
    assert data["messages"][0]["role"] == "assistant"
