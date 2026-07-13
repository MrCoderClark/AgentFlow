from httpx import AsyncClient


async def register(client: AsyncClient, slug: str) -> str:
    resp = await client.post("/api/auth/register", json={
        "org_name": slug, "org_slug": slug,
        "email": f"a@{slug}.com", "password": "p", "name": "A",
    })
    return resp.json()["access_token"]


async def test_org_settings(client: AsyncClient):
    token = await register(client, "org-test")
    h = {"Authorization": f"Bearer {token}"}

    resp = await client.get("/api/org", headers=h)
    assert resp.status_code == 200
    assert resp.json()["slug"] == "org-test"

    resp = await client.put("/api/org", json={"widget_config": {"color": "#0066ff"}}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["widget_config"]["color"] == "#0066ff"


async def test_api_keys(client: AsyncClient):
    token = await register(client, "key-test")
    h = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/org/api-keys", json={"provider": "openai", "api_key": "sk-test"}, headers=h)
    assert resp.status_code == 201
    assert "encrypted_key" not in resp.json()

    resp = await client.get("/api/org/api-keys", headers=h)
    assert len(resp.json()) == 1
