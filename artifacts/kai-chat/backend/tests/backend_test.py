"""Backend tests for Lumi (economical: minimal Gemini calls)."""
import os
import time
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if os.environ.get('REACT_APP_BACKEND_URL') else None
if not BASE_URL:
    # Fallback: read from frontend .env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')

API = f"{BASE_URL}/api"

USER_A = {"email": "teste1@lumi.app", "password": "senha12345", "name": "Teste 1"}
USER_B_EMAIL = f"testb_{uuid.uuid4().hex[:8]}@lumi.app"
USER_B = {"email": USER_B_EMAIL, "password": "senha12345", "name": "Teste B"}


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def session_a():
    s = requests.Session()
    # Try login first (user A seeded by main agent), else register
    r = s.post(f"{API}/auth/login", json={"email": USER_A["email"], "password": USER_A["password"]})
    if r.status_code != 200:
        r = s.post(f"{API}/auth/register", json=USER_A)
        assert r.status_code == 200, f"Register A failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def session_b():
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json=USER_B)
    assert r.status_code == 200, f"Register B failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def mongo():
    # Need db name from backend .env
    db_name = "test_database"
    with open('/app/backend/.env') as f:
        for line in f:
            if line.startswith('DB_NAME'):
                db_name = line.split('=', 1)[1].strip().strip('"')
    cli = MongoClient("mongodb://localhost:27017")
    return cli[db_name]


# ---------- Auth ----------
class TestAuth:
    def test_duplicate_email_409(self, session_a):
        r = requests.post(f"{API}/auth/register", json=USER_A)
        assert r.status_code == 409

    def test_wrong_password_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": USER_A["email"], "password": "wrong!!!"})
        assert r.status_code == 401

    def test_invalid_email_422(self):
        r = requests.post(f"{API}/auth/register", json={"name": "x", "email": "bad", "password": "senha12345"})
        assert r.status_code == 422

    def test_me(self, session_a):
        r = session_a.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == USER_A["email"]

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Characters ----------
class TestCharacters:
    def test_categories(self):
        r = requests.get(f"{API}/categories")
        assert r.status_code == 200
        assert "Fantasia" in r.json()

    def test_list_has_seed(self):
        r = requests.get(f"{API}/characters")
        assert r.status_code == 200
        names = [c["name"] for c in r.json()]
        for seed in ["Aria", "Sora", "Kaelen", "Nyra", "Vex"]:
            assert seed in names, f"Missing seed: {seed}"

    def test_search_filter(self):
        r = requests.get(f"{API}/characters", params={"q": "Aria"})
        assert r.status_code == 200
        assert any(c["name"] == "Aria" for c in r.json())

    def test_category_filter(self):
        r = requests.get(f"{API}/characters", params={"category": "Fantasia"})
        assert r.status_code == 200
        for c in r.json():
            assert c["category"] == "Fantasia"

    def test_create_char_public(self, session_a):
        payload = {
            "name": "TEST_HeroA", "category": "Fantasia",
            "description": "Descrição teste A longa o suficiente.",
            "personality": "Personalidade teste A longa o suficiente.",
            "greeting": "Olá, sou TEST_HeroA.", "avatar_url": "", "is_public": True,
        }
        r = session_a.post(f"{API}/characters", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_HeroA"
        assert data["is_owner"] is True
        pytest.char_a_id = data["id"]

    def test_create_char_private(self, session_a):
        payload = {
            "name": "TEST_PrivateA", "category": "Mistério",
            "description": "Descrição privada aaaa.",
            "personality": "Personalidade privada aaaa.",
            "greeting": "Olá segredinho.", "avatar_url": "", "is_public": False,
        }
        r = session_a.post(f"{API}/characters", json=payload)
        assert r.status_code == 200
        pytest.char_a_private_id = r.json()["id"]

    def test_private_not_visible_to_b(self, session_b):
        r = session_b.get(f"{API}/characters/{pytest.char_a_private_id}")
        assert r.status_code == 404

    def test_private_not_in_public_list(self, session_b):
        r = session_b.get(f"{API}/characters")
        ids = [c["id"] for c in r.json()]
        assert pytest.char_a_private_id not in ids

    def test_update_by_other_403(self, session_b):
        payload = {
            "name": "Hacked", "category": "Fantasia",
            "description": "Descrição hackeada aaaa.",
            "personality": "Personalidade hackeada aaaa.",
            "greeting": "oi", "avatar_url": "", "is_public": True,
        }
        r = session_b.put(f"{API}/characters/{pytest.char_a_id}", json=payload)
        assert r.status_code == 403

    def test_delete_by_other_403(self, session_b):
        r = session_b.delete(f"{API}/characters/{pytest.char_a_id}")
        assert r.status_code == 403

    def test_update_by_owner(self, session_a):
        payload = {
            "name": "TEST_HeroA2", "category": "Aventura",
            "description": "Descrição atualizada aaaa.",
            "personality": "Personalidade atualizada aaaa.",
            "greeting": "oi atualizado", "avatar_url": "", "is_public": True,
        }
        r = session_a.put(f"{API}/characters/{pytest.char_a_id}", json=payload)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_HeroA2"
        g = session_a.get(f"{API}/characters/{pytest.char_a_id}")
        assert g.json()["name"] == "TEST_HeroA2"

    def test_invalid_category(self, session_a):
        payload = {
            "name": "Bad", "category": "Invalid!!!",
            "description": "x" * 11, "personality": "y" * 11, "greeting": "hi",
            "avatar_url": "", "is_public": True,
        }
        r = session_a.post(f"{API}/characters", json=payload)
        assert r.status_code == 422

    def test_short_description(self, session_a):
        payload = {
            "name": "Bad", "category": "Fantasia",
            "description": "short", "personality": "y" * 11, "greeting": "hi",
            "avatar_url": "", "is_public": True,
        }
        r = session_a.post(f"{API}/characters", json=payload)
        assert r.status_code == 422


# ---------- Favorites & Reports ----------
class TestFavoritesReports:
    def test_favorite_toggle(self, session_a):
        # Favorite a seed character
        chars = requests.get(f"{API}/characters").json()
        seed_id = next(c["id"] for c in chars if c["name"] == "Aria")
        r = session_a.post(f"{API}/characters/{seed_id}/favorite")
        assert r.status_code == 200
        assert r.json()["is_favorite"] is True
        favs = session_a.get(f"{API}/favorites").json()
        assert any(c["id"] == seed_id for c in favs)
        # Toggle off
        r = session_a.post(f"{API}/characters/{seed_id}/favorite")
        assert r.json()["is_favorite"] is False

    def test_report(self, session_b):
        chars = requests.get(f"{API}/characters").json()
        seed_id = next(c["id"] for c in chars if c["name"] == "Aria")
        r = session_b.post(f"{API}/characters/{seed_id}/report", json={"reason": "Conteúdo inadequado teste"})
        assert r.status_code == 200


# ---------- Conversations ----------
class TestConversations:
    def test_start_conversation(self, session_a):
        chars = requests.get(f"{API}/characters").json()
        seed_id = next(c["id"] for c in chars if c["name"] == "Sora")
        r = session_a.post(f"{API}/conversations", json={"character_id": seed_id})
        assert r.status_code == 200
        pytest.conv_id = r.json()["id"]
        pytest.conv_char_id = seed_id

    def test_get_conversation_has_greeting(self, session_a):
        r = session_a.get(f"{API}/conversations/{pytest.conv_id}")
        assert r.status_code == 200
        data = r.json()
        assert len(data["messages"]) >= 1
        assert data["messages"][0]["role"] == "assistant"

    def test_other_user_cannot_read_conv(self, session_b):
        r = session_b.get(f"{API}/conversations/{pytest.conv_id}")
        assert r.status_code == 404

    def test_other_user_cannot_send_in_conv(self, session_b):
        r = session_b.post(f"{API}/conversations/{pytest.conv_id}/messages", json={"text": "oi"})
        assert r.status_code == 404

    def test_empty_message_422(self, session_a):
        r = session_a.post(f"{API}/conversations/{pytest.conv_id}/messages", json={"text": "   "})
        assert r.status_code == 422

    def test_too_long_message_422(self, session_a):
        r = session_a.post(f"{API}/conversations/{pytest.conv_id}/messages", json={"text": "a" * 1001})
        assert r.status_code == 422

    def test_rate_limit_minute(self, session_a, mongo):
        """Simulate 6 messages/min already saved by inserting directly into Mongo. No Gemini call."""
        from datetime import datetime, timezone
        user = session_a.get(f"{API}/auth/me").json()
        uid = user["id"]
        now = datetime.now(timezone.utc)
        docs = [{
            "id": f"test_rl_{uuid.uuid4()}", "conversation_id": pytest.conv_id,
            "user_id": uid, "role": "user", "content": f"ping {i}", "created_at": now,
        } for i in range(6)]
        mongo.messages.insert_many(docs)
        try:
            r = session_a.post(f"{API}/conversations/{pytest.conv_id}/messages", json={"text": "overflow"})
            assert r.status_code == 429, f"Expected 429, got {r.status_code}: {r.text}"
            body = r.json().get("detail", "")
            assert "minuto" in body.lower() or "minute" in body.lower() or "muitas" in body.lower()
        finally:
            mongo.messages.delete_many({"id": {"$regex": "^test_rl_"}})

    def test_send_message_streaming(self, session_a):
        """One real Gemini call to verify SSE streaming works."""
        r = session_a.post(f"{API}/conversations/{pytest.conv_id}/messages",
                           json={"text": "Diga apenas: ola"}, stream=True, timeout=60)
        assert r.status_code == 200
        got_delta = False
        got_done = False
        for line in r.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("data:"):
                import json as _json
                payload = _json.loads(line[5:].strip())
                if payload.get("type") == "delta":
                    got_delta = True
                elif payload.get("type") == "done":
                    got_done = True
                    break
                elif payload.get("type") == "error":
                    pytest.fail(f"Stream error: {payload.get('message')}")
        assert got_delta and got_done, f"delta={got_delta} done={got_done}"
        # Verify persisted
        conv = session_a.get(f"{API}/conversations/{pytest.conv_id}").json()
        assert any(m["role"] == "user" and "ola" in m["content"].lower() for m in conv["messages"])
        assert any(m["role"] == "assistant" and m["content"] for m in conv["messages"][1:])

    def test_list_conversations(self, session_a):
        r = session_a.get(f"{API}/conversations")
        assert r.status_code == 200
        assert any(c["id"] == pytest.conv_id for c in r.json())


# ---------- Cleanup ----------
def test_cleanup(session_a):
    # Delete created characters
    for attr in ("char_a_id", "char_a_private_id"):
        cid = getattr(pytest, attr, None)
        if cid:
            session_a.delete(f"{API}/characters/{cid}")
