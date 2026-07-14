from app.services.encryption import decrypt, encrypt


def test_encrypt_decrypt():
    original = "sk-test-api-key-12345"
    encrypted = encrypt(original)
    assert encrypted != original
    assert decrypt(encrypted) == original
