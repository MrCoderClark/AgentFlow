from email.message import EmailMessage

import aiosmtplib

from app.config import settings


async def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = "noreply@support.local"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    await aiosmtplib.send(msg, hostname=settings.SMTP_HOST, port=settings.SMTP_PORT)


async def send_invite_email(to: str, org_name: str, invite_token: str):
    body = f"You've been invited to join {org_name}.\n\nAccept: http://localhost:3000/accept-invite?token={invite_token}"
    await send_email(to, f"Invitation to join {org_name}", body)


async def send_verification_email(to: str, token: str):
    body = f"Verify your email: http://localhost:3000/verify?token={token}"
    await send_email(to, "Verify your email", body)
