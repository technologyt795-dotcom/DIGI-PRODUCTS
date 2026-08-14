import { useEffect } from "react";

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  type?: "website" | "product";
  noIndex?: boolean;
  jsonLd?: JsonLd;
}

const SITE_NAME = "Digl Products";
const DEFAULT_DESCRIPTION =
  "متجر Digl Products للمنتجات الرقمية الأصلية بأسعار ذكية، مع تحميل فوري ووصول مدى الحياة ودفع آمن.";

function upsertMeta(
  selector: string,
  attribute: "name" | "property",
  key: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function toAbsoluteUrl(value: string | null | undefined, origin: string) {
  if (!value) return undefined;
  try {
    return new URL(value, origin).toString();
  } catch {
    return undefined;
  }
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove();
}

export function SEO({
  title,
  description,
  path,
  image,
  type = "website",
  noIndex = false,
  jsonLd,
}: SEOProps) {
  useEffect(() => {
    const origin = window.location.origin;
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    const requestedPath =
      path || `${window.location.pathname}${window.location.search}`;
    const currentPath =
      basePath && !requestedPath.startsWith(basePath)
        ? `${basePath}${requestedPath.startsWith("/") ? requestedPath : `/${requestedPath}`}`
        : requestedPath;
    const canonicalUrl = new URL(currentPath || "/", origin).toString();
    const imageUrl = toAbsoluteUrl(image, origin);
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

    document.title = fullTitle;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta(
      'meta[name="robots"]',
      "name",
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow",
    );
    upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      description,
    );
    upsertMeta('meta[property="og:type"]', "property", "og:type", type);
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    upsertMeta('meta[property="og:locale"]', "property", "og:locale", "ar_SA");
    upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
    upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    upsertMeta(
      'meta[name="twitter:description"]',
      "name",
      "twitter:description",
      description,
    );

    if (imageUrl) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", imageUrl);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", imageUrl);
    } else {
      removeMeta('meta[property="og:image"]');
      removeMeta('meta[name="twitter:image"]');
    }

    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const oldJsonLd = document.head.querySelector('script[data-store-seo="jsonld"]');
    oldJsonLd?.remove();
    if (jsonLd && !noIndex) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.storeSeo = "jsonld";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [description, image, jsonLd, noIndex, path, title, type]);

  return null;
}

export { DEFAULT_DESCRIPTION, SITE_NAME };