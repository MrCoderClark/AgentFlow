from pydantic import BaseModel, EmailStr

from app.models.agent import AgentRole


class RegisterRequest(BaseModel):
    org_name: str
    org_slug: str
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    org_slug: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class InviteRequest(BaseModel):
    email: EmailStr
    name: str
    role: AgentRole = AgentRole.agent
