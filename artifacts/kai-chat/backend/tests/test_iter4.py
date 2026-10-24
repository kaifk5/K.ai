"""Iteration 4 - K.ai: conversation background + character comments."""
import os
import uuid
import pytest
import requests

BASE = os.environ['REACT_APP_BACKEND_URL'].rstrip('/')
API = f"{BASE}/api"


def _register(prefix="TEST_u4"):
    s = requests.Session()
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@lumi.app"
    r = s.post(f"{API}/auth/register", json={
        "name": "Tester", "email": email, "password": "senha12345", "adult_confirmed": True})
    assert r.status_code == 200, r.text
    return s, r.json()


def _login_a():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "teste1@lumi.app", "password": "senha12345"})
    assert r.status_code == 200
    return s


def _first_char(s):
    r = s.get(f"{API}/characters")
    assert r.status_code == 200
    assert r.json()
    return r.json()[0]["id"]


def _start_conv(s, cid):
    r = s.post(f"{API}/conversations", json={"character_id": cid})
    assert r.status_code == 200
    return r.json()["id"]


# ---------- Background ----------
def test_background_accepts_empty_and_api_files():
    s, _ = _register()
    cid = _first_char(s)
    conv = _start_conv(s, cid)
    # empty => character photo fallback
    r = s.put(f"{API}/conversations/{conv}/background", json={"background_url": ""})
    assert r.status_code == 200
    assert r.json()["background_url"] == ""

    # /api/files/... accepted
    r = s.put(f"{API}/conversations/{conv}/background",
              json={"background_url": "/api/files/kai/uploads/abc/pic.jpg"})
    assert r.status_code == 200
    assert r.json()["background_url"] == "/api/files/kai/uploads/abc/pic.jpg"

    # persisted via GET
    r = s.get(f"{API}/conversations/{conv}")
    assert r.status_code == 200
    assert r.json()["conversation"]["background_url"] == "/api/files/kai/uploads/abc/pic.jpg"


def test_background_rejects_javascript_scheme():
    s, _ = _register()
    cid = _first_char(s)
    conv = _start_conv(s, cid)
    r = s.put(f"{API}/conversations/{conv}/background",
              json={"background_url": "javascript:alert(1)"})
    assert r.status_code == 422


def test_background_cross_user_404():
    s_a, _ = _register("TEST_bga")
    s_b, _ = _register("TEST_bgb")
    cid = _first_char(s_a)
    conv_a = _start_conv(s_a, cid)
    r = s_b.put(f"{API}/conversations/{conv_a}/background",
                json={"background_url": ""})
    assert r.status_code == 404


# ---------- Comments ----------
def test_comments_crud_and_author_only_delete():
    s_a, me_a = _register("TEST_ca")
    s_b, me_b = _register("TEST_cb")
    cid = _first_char(s_a)

    # Empty list initially (character-specific)
    r = s_a.get(f"{API}/characters/{cid}/comments")
    assert r.status_code == 200
    initial_ids = {c["id"] for c in r.json()}

    # A posts a comment
    r = s_a.post(f"{API}/characters/{cid}/comments", json={"text": "Olá mundo!"})
    assert r.status_code == 200, r.text
    c_a = r.json()
    assert c_a["text"] == "Olá mundo!"
    assert c_a["is_mine"] is True
    assert c_a["user_name"] == me_a["name"]
    assert "user_id" not in c_a
    assert "_id" not in c_a
    cid_a = c_a["id"]

    # B lists -> sees A's comment with is_mine=False
    r = s_b.get(f"{API}/characters/{cid}/comments")
    assert r.status_code == 200
    found = [c for c in r.json() if c["id"] == cid_a]
    assert found and found[0]["is_mine"] is False

    # B tries to delete A's comment -> 404
    r = s_b.delete(f"{API}/comments/{cid_a}")
    assert r.status_code == 404

    # A deletes own -> 200
    r = s_a.delete(f"{API}/comments/{cid_a}")
    assert r.status_code == 200

    # Confirm removed
    r = s_a.get(f"{API}/characters/{cid}/comments")
    assert all(c["id"] != cid_a for c in r.json())


def test_comment_empty_text_422():
    s, _ = _register()
    cid = _first_char(s)
    r = s.post(f"{API}/characters/{cid}/comments", json={"text": "   "})
    assert r.status_code == 422

    r = s.post(f"{API}/characters/{cid}/comments", json={"text": ""})
    assert r.status_code == 422


def test_comment_unauth_cannot_post():
    s = requests.Session()
    # Need a valid character id
    r = s.get(f"{API}/characters")
    assert r.status_code == 200 and r.json()
    cid = r.json()[0]["id"]
    r = s.post(f"{API}/characters/{cid}/comments", json={"text": "hi"})
    assert r.status_code == 401
