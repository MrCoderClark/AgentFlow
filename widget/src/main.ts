import { createWidget } from "./widget";

const script = document.currentScript as HTMLScriptElement;
const orgSlug = script?.getAttribute("data-org");
const apiBase = script?.getAttribute("data-api") || "http://localhost:8000";

if (orgSlug) {
  createWidget(orgSlug, apiBase);
}
