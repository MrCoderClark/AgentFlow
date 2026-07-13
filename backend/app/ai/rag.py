import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.provider import LLMProvider
from app.models import KnowledgeArticle


async def embed_article(article: KnowledgeArticle, db: AsyncSession, provider: LLMProvider):
    embedding = await provider.embed(f"{article.title}\n{article.content}")
    article.embedding = embedding
    await db.commit()


async def search_knowledge(
    org_id: uuid.UUID,
    query: str,
    db: AsyncSession,
    provider: LLMProvider,
    top_k: int = 3,
) -> list[str]:
    query_embedding = await provider.embed(query)

    result = await db.execute(
        select(KnowledgeArticle.title, KnowledgeArticle.content)
        .where(
            KnowledgeArticle.org_id == org_id,
            KnowledgeArticle.embedding.is_not(None),
        )
        .order_by(KnowledgeArticle.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )
    rows = result.all()
    return [f"## {row.title}\n{row.content}" for row in rows]
