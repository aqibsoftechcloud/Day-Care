import { prisma } from "@/lib/prisma";
import { sanitizeHtmlFields } from "@/lib/sanitize-html.server";
import type {
  CreateSymptomArticleInput,
  ListSymptomArticlesQuery,
  UpdateSymptomArticleInput,
} from "@/validators/symptom-article.validator";

export class SymptomArticleNotFoundError extends Error {
  constructor(id: number) {
    super(`Symptom article with id ${id} not found`);
    this.name = "SymptomArticleNotFoundError";
  }
}

export class SymptomPartNotFoundError extends Error {
  constructor(partId: number) {
    super(`Symptom part with id ${partId} not found`);
    this.name = "SymptomPartNotFoundError";
  }
}

export class SymptomNotFoundError extends Error {
  constructor(symptomId: number) {
    super(`Symptom with id ${symptomId} not found`);
    this.name = "SymptomNotFoundError";
  }
}

const symptomArticleSelect = {
  id: true,
  article_name: true,
  part_id: true,
  symptom_id: true,
  meta_title: true,
  meta_description: true,
  meta_keywords: true,
  seo_url: true,
  description: true,
  status: true,
  created_at: true,
  updated_at: true,
  symptom_parts: { select: { id: true, part_name: true } },
  symptoms: { select: { id: true, symptom_name: true } },
} as const;

type SymptomArticleRecord = {
  id: number;
  article_name: string;
  part_id: number;
  symptom_id: number;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  symptom_parts: { id: number; part_name: string };
  symptoms: { id: number; symptom_name: string };
};

function toSafeSymptomArticle(article: SymptomArticleRecord) {
  const { symptom_parts, symptoms, ...rest } = article;

  return { ...rest, part: symptom_parts, symptom: symptoms };
}

async function ensureSymptomPartExists(partId: number) {
  const part = await prisma.symptom_parts.findUnique({
    where: { id: partId },
  });

  if (!part) {
    throw new SymptomPartNotFoundError(partId);
  }
}

async function ensureSymptomExists(symptomId: number) {
  const symptom = await prisma.symptoms.findUnique({
    where: { id: symptomId },
  });

  if (!symptom) {
    throw new SymptomNotFoundError(symptomId);
  }
}

export async function getSymptomArticles(filter?: ListSymptomArticlesQuery) {
  const articles = await prisma.symptom_articles.findMany({
    where: {
      ...(filter?.part_id !== undefined ? { part_id: filter.part_id } : {}),
      ...(filter?.symptom_id !== undefined
        ? { symptom_id: filter.symptom_id }
        : {}),
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: symptomArticleSelect,
    orderBy: { id: "asc" },
  });

  return articles.map(toSafeSymptomArticle);
}

export async function getSymptomArticleById(id: number) {
  const article = await prisma.symptom_articles.findUnique({
    where: { id },
    select: symptomArticleSelect,
  });

  if (!article) {
    throw new SymptomArticleNotFoundError(id);
  }

  return toSafeSymptomArticle(article);
}

/**
 * Public lookup by `seo_url` — returns the active symptom article, or
 * `null` if none is active with this seo_url (never throws).
 *
 * When `expectedPartSeoUrl` is supplied (the `/conditions/{part}/{article}`
 * URL's own part segment), it is validated as part of the same query via
 * the `symptom_parts` relation filter — a mismatch simply yields no row
 * (`null`), rather than an extra round trip to compare afterwards. The
 * future public route is expected to treat that as "exists, wrong part"
 * and issue a redirect to the article's actual canonical part, not a 404.
 */
export async function getSymptomArticleBySeoUrl(
  seoUrl: string,
  expectedPartSeoUrl?: string
) {
  const article = await prisma.symptom_articles.findFirst({
    where: {
      seo_url: seoUrl,
      status: "active",
      ...(expectedPartSeoUrl !== undefined
        ? { symptom_parts: { seo_url: expectedPartSeoUrl } }
        : {}),
    },
    select: symptomArticleSelect,
  });

  return article ? toSafeSymptomArticle(article) : null;
}

export async function createSymptomArticle(input: CreateSymptomArticleInput) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await ensureSymptomPartExists(data.part_id);
  await ensureSymptomExists(data.symptom_id);

  const article = await prisma.symptom_articles.create({
    data,
    select: symptomArticleSelect,
  });

  return toSafeSymptomArticle(article);
}

export async function updateSymptomArticle(
  id: number,
  input: UpdateSymptomArticleInput
) {
  const data = sanitizeHtmlFields(input, ["description"]);
  await getSymptomArticleById(id);

  if (data.part_id !== undefined) {
    await ensureSymptomPartExists(data.part_id);
  }

  if (data.symptom_id !== undefined) {
    await ensureSymptomExists(data.symptom_id);
  }

  const article = await prisma.symptom_articles.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: symptomArticleSelect,
  });

  return toSafeSymptomArticle(article);
}

/**
 * Soft delete: deactivates the article by setting status to "inactive".
 * Leaf node in the hierarchy — no children to protect against.
 */
export async function deleteSymptomArticle(id: number) {
  await getSymptomArticleById(id);

  await prisma.symptom_articles.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
