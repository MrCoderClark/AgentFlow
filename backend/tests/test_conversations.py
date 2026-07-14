from httpx import AsyncClient


async def register_and_get_token(client: AsyncClient, slug: str) -> str:
    resp = await client.post("/api/auth/register", json={
        "org_name": f"{slug} Co",
        "org_slug": slug,
        "email": f"admin@{slug}.com",
        "password": "pass123",
        "name": "Admin",
    })
    return resp.json()["access_token"]


def auth(token: str):
    return {"Authorization": f"Bearer {token}"}


async def test_contact_crud(client: AsyncClient):
    token = await register_and_get_token(client, "contact-test")
    h = auth(token)

    resp = await client.post("/api/contacts", json={"name": "Alice", "email": "alice@example.com"}, headers=h)
    assert resp.status_code == 201
    contact_id = resp.json()["id"]

    resp = await client.get("/api/contacts", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1

    resp = await client.get(f"/api/contacts/{contact_id}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Alice"

    resp = await client.put(f"/api/contacts/{contact_id}", json={"name": "Alice Updated"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["name"] == "Alice Updated"


async def test_conversation_flow(client: AsyncClient):
    token = await register_and_get_token(client, "conv-test")
    h = auth(token)

    contact = await client.post("/api/contacts", json={"name": "Bob"}, headers=h)
    contact_id = contact.json()["id"]

    resp = await client.post("/api/conversations", json={"contact_id": contact_id, "subject": "Help me"}, headers=h)
    assert resp.status_code == 201
    conv_id = resp.json()["id"]

    resp = await client.post(f"/api/conversations/{conv_id}/messages", json={"content": "Hello!"}, headers=h)
    assert resp.status_code == 201

    resp = await client.get(f"/api/conversations/{conv_id}/messages", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["content"] == "Hello!"

    resp = await client.post(f"/api/conversations/{conv_id}/notes", json={"content": "Internal note"}, headers=h)
    assert resp.status_code == 201

    resp = await client.get(f"/api/conversations/{conv_id}/notes", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
