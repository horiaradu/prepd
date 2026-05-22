import type { Metadata } from "next";
import { Landing } from "@/components/Landing";
import { JsonLd } from "@/components/JsonLd";
import { landingStructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: {
    absolute: "Mintdish — Skip the food blog. Just the recipe.",
  },
  description:
    "Paste a recipe link, YouTube video, or photo — Mintdish pulls out ingredients, steps, and timing. No food blog fluff.",
  alternates: {
    canonical: "/welcome",
    languages: {
      en: "/welcome",
      ro: "/welcome/ro",
      "x-default": "/welcome",
    },
  },
  openGraph: {
    title: "Mintdish — Skip the food blog. Just the recipe.",
    description:
      "Paste a recipe link, YouTube video, or photo — Mintdish pulls out ingredients, steps, and timing. No food blog fluff.",
  },
  twitter: {
    title: "Mintdish — Skip the food blog. Just the recipe.",
    description:
      "Paste a recipe link, YouTube video, or photo — Mintdish pulls out ingredients, steps, and timing. No food blog fluff.",
  },
};

export default function Welcome() {
  return (
    <>
      <JsonLd data={landingStructuredData("en")} />
      <Landing locale="en" />
    </>
  );
}
