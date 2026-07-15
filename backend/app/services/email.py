from email.message import EmailMessage

import aiosmtplib

from app.config import settings


async def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    # Port 465 = implicit SSL, port 587 = STARTTLS
    use_tls = settings.SMTP_PORT == 465
    start_tls = settings.SMTP_PORT == 587

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        use_tls=use_tls,
        start_tls=start_tls,
    )


async def send_invite_email(to: str, org_name: str, invite_token: str):
    link = f"{settings.FRONTEND_URL}/accept-invite?token={invite_token}"
    body = (
        f"You've been invited to join {org_name} on AgentFlow.\n\n"
        f"Click below to set your password and get started:\n{link}\n\n"
        f"This link expires in 15 minutes."
    )
    await send_email(to, f"Invitation to join {org_name}", body)


async def send_verification_email(to: str, token: str):
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    body = (
        f"Welcome to AgentFlow!\n\n"
        f"Please verify your email address:\n{link}\n\n"
        f"This link expires in 15 minutes."
    )
    await send_email(to, "Verify your email", body)
