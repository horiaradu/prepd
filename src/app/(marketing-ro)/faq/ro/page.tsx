import type { Metadata } from "next";
import { FaqPage } from "@/components/FaqPage";

export const metadata: Metadata = {
  title: "Întrebări frecvente",
  description:
    "Răspunsuri despre cum procesează Mintdish rețete din linkuri, videoclipuri YouTube și poze, cât costă și cum intri în beta.",
  alternates: {
    canonical: "/faq/ro",
    languages: {
      en: "/faq",
      ro: "/faq/ro",
      "x-default": "/faq",
    },
  },
  openGraph: {
    title: "Întrebări frecvente — Mintdish",
    description:
      "Răspunsuri despre cum procesează Mintdish rețete din linkuri, videoclipuri YouTube și poze, cât costă și cum intri în beta.",
  },
  twitter: {
    title: "Întrebări frecvente — Mintdish",
    description:
      "Răspunsuri despre cum procesează Mintdish rețete din linkuri, videoclipuri YouTube și poze, cât costă și cum intri în beta.",
  },
};

export default function FaqRo() {
  return <FaqPage locale="ro" />;
}
