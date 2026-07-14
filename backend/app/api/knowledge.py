import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, KnowledgeArticle
from app.schemas.knowledge import KnowledgeArticleCreate, KnowledgeArticleResponse, KnowledgeArticleUpdate

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("", response_model=list[KnowledgeArticleResponse])
async def list_articles(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.org_id == agent.org_id).order_by(KnowledgeArticle.updated_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=KnowledgeArticleResponse, status_code=status.HTTP_201_CREATED)
async def create_article(
    req: KnowledgeArticleCreate, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    article = KnowledgeArticle(org_id=agent.org_id, title=req.title, content=req.content)
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return article


@router.get("/{article_id}", response_model=KnowledgeArticleResponse)
async def get_article(
    article_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id, KnowledgeArticle.org_id == agent.org_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Not found")
    return article


@router.put("/{article_id}", response_model=KnowledgeArticleResponse)
async def update_article(
    article_id: uuid.UUID, req: KnowledgeArticleUpdate,
    agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id, KnowledgeArticle.org_id == agent.org_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(article, k, v)
    await db.commit()
    await db.refresh(article)
    return article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id, KnowledgeArticle.org_id == agent.org_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(article)
    await db.commit()
