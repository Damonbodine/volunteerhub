type SearchParamsLike = {
  get(name: string): string | null;
};

export function withPreservedDemoQuery(
  href: string,
  searchParams: SearchParamsLike,
) {
  const demo = searchParams.get("demo");
  const step = searchParams.get("step");

  if (!demo) {
    return href;
  }

  const url = new URL(href, "https://demo.local");
  url.searchParams.set("demo", demo);

  if (step) {
    url.searchParams.set("step", step);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
