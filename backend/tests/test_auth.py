from httpx import AsyncClient


async def test_register(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "org_name": "Acme Corp",
        "org_slug": "acme-corp",
        "email": "founder@acme.com",
        "password": "securepass123",
        "name": "Jane Founder",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


async def test_register_duplicate_slug(client: AsyncClient):
    payload = {
        "org_name": "Dup Corp",
        "org_slug": "dup-corp",
        "email": "a@dup.com",
        "password": "pass123",
        "name": "A",
    }
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json={**payload, "email": "b@dup.com"})
    assert resp.status_code == 409


async def test_login(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "org_name": "Login Co",
        "org_slug": "login-co",
        "email": "user@login.com",
        "password": "pass123",
        "name": "User",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "user@login.com",
        "password": "pass123",
        "org_slug": "login-co",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "org_name": "Wrong Co",
        "org_slug": "wrong-co",
        "email": "user@wrong.com",
        "password": "right",
        "name": "User",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "user@wrong.com",
        "password": "wrong",
        "org_slug": "wrong-co",
    })
    assert resp.status_code == 401
