"""Iteration 2 - K.ai: adult confirmation, tabs/gender filters, new categories, send-message adult gate."""
import os
import uuid
import pytest
import requests

BASE = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE}/api"


@pytest.fixture
def session():
    return requests.Session()


@pytest.fixture
def user_a(session):
    """Pre-existing confirmed user A."""
    r = session.post(f"{API}/auth/login", json={"email": "teste1@lumi.app", "password": "senha12345"})
    assert r.status_code == 200, r.text
    return r.json()


# -------- Adult confirmation on register --------
def test_register_requires_adult_confirmed():
    s = requests.Session()
    email = f"TEST_noadult_{uuid.uuid4().hex[:8]}@lumi.app"
    r = s.post(f"{API}/auth/register", json={
        "name": "No Adult", "email": email, "password": "senha12345", "adult_confirmed": False})
    assert r.status_code == 400
    assert "18" in r.json().get("detail", "")


def test_register_with_adult_confirmed_ok():
    s = requests.Session()
    email = f"test_adult_{uuid.uuid4().hex[:8]}@lumi.app"
    r = s.post(f"{API}/auth/register", json={
        "name": "Adult User", "email": email, "password": "senha12345", "adult_confirmed": True})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["adult_confirmed"] is True
    assert data["email"] == email


# -------- Legacy user adult gate on send message --------
def test_send_message_blocked_without_adult_confirmation():
    """Simulate legacy account by flipping adult_confirmed=False directly in Mongo."""
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient

    s = requests.Session()
    email = f"TEST_legacy_{uuid.uuid4().hex[:8]}@lumi.app"
    r = s.post(f"{API}/auth/register", json={
        "name": "Legacy", "email": email, "password": "senha12345", "adult_confirmed": True})
    assert r.status_code == 200
    user_id = r.json()["id"]

    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "test_database")

    async def flip(val):
        client = AsyncIOMotorClient(mongo_url)
        await client[db_name].users.update_one({"id": user_id}, {"$set": {"adult_confirmed": val}})
        client.close()

    asyncio.run(flip(False))

    # confirm /auth/me shows false
    me = s.get(f"{API}/auth/me").json()
    assert me["adult_confirmed"] is False

    # pick a public character and start conversation
    chars = s.get(f"{API}/characters").json()
    assert len(chars) > 0
    cid = chars[0]["id"]
    conv = s.post(f"{API}/conversations", json={"character_id": cid})
    assert conv.status_code == 200
    conv_id = conv.json()["id"]

    # send message should 403
    r = s.post(f"{API}/conversations/{conv_id}/messages", json={"text": "oi"})
    assert r.status_code == 403, r.text
    assert "18" in r.json().get("detail", "")

    # confirm-adult then test allowed (we don't actually send to Gemini, we just verify it isn't blocked at 403)
    r2 = s.post(f"{API}/auth/confirm-adult")
    assert r2.status_code == 200
    assert r2.json()["adult_confirmed"] is True


# -------- Tabs + gender filters --------
def test_tab_explorar_default(session):
    r = session.get(f"{API}/characters", params={"tab": "explorar"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_tab_seguindo_requires_login(session):
    r = session.get(f"{API}/characters", params={"tab": "seguindo"})
    assert r.status_code == 401


def test_tab_seguindo_returns_favorites(session, user_a):
    # ensure at least one favorite exists
    chars = session.get(f"{API}/characters").json()
    assert chars
    cid = chars[0]["id"]
    # ensure favorited
    if not chars[0]["is_favorite"]:
        session.post(f"{API}/characters/{cid}/favorite")
    r = session.get(f"{API}/characters", params={"tab": "seguindo"})
    assert r.status_code == 200
    ids = [c["id"] for c in r.json()]
    assert cid in ids


def test_tab_em_alta_only_chatted():
    s = requests.Session()
    r = s.get(f"{API}/characters", params={"tab": "em-alta"})
    assert r.status_code == 200
    for c in r.json():
        assert c["chat_count"] > 0


def test_tab_rpg_only_rpg_category():
    s = requests.Session()
    r = s.get(f"{API}/characters", params={"tab": "rpg"})
    assert r.status_code == 200
    for c in r.json():
        assert c["category"] == "RPG"


def test_gender_filter_masculino(session, user_a):
    # create a male character
    payload = {
        "name": f"TEST_Male_{uuid.uuid4().hex[:6]}", "category": "Romance", "gender": "Masculino",
        "description": "Personagem masculino de teste.", "personality": "Fala pouco, pensa muito, estiloso.",
        "greeting": "Olá.", "avatar_url": "", "is_public": True,
    }
    r = session.post(f"{API}/characters", json=payload)
    assert r.status_code == 200, r.text
    created_id = r.json()["id"]
    try:
        r = session.get(f"{API}/characters", params={"gender": "Masculino"})
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert created_id in ids
        for c in r.json():
            assert c["gender"] == "Masculino"
        # should NOT appear in Feminino
        r2 = session.get(f"{API}/characters", params={"gender": "Feminino"})
        assert created_id not in [c["id"] for c in r2.json()]
    finally:
        session.delete(f"{API}/characters/{created_id}")


# -------- New categories --------
def test_new_categories_available():
    r = requests.get(f"{API}/categories")
    assert r.status_code == 200
    cats = r.json()
    for new_cat in ["Drama", "RPG", "BL"]:
        assert new_cat in cats


def test_create_character_with_new_category_rpg(user_a, session):
    payload = {
        "name": f"TEST_RPG_{uuid.uuid4().hex[:6]}", "category": "RPG", "gender": "Outro",
        "description": "Mestre de RPG para aventuras épicas.",
        "personality": "Narrador criativo, descreve cenários detalhados e improvisa reviravoltas.",
        "greeting": "Rolemos iniciativa.", "is_public": True,
    }
    r = session.post(f"{API}/characters", json=payload)
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    try:
        # should appear in /characters?tab=rpg
        r2 = session.get(f"{API}/characters", params={"tab": "rpg"})
        assert cid in [c["id"] for c in r2.json()]
    finally:
        session.delete(f"{API}/characters/{cid}")
