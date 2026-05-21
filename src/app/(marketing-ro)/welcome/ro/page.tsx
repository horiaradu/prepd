import type { Metadata } from "next";
import { Landing } from "@/components/Landing";

export const metadata: Metadata = {
  title: {
    absolute: "Mintdish — Sari peste blogul culinar. Direct rețeta.",
  },
  description:
    "Lipește un link de rețetă, un clip YouTube sau o poză — Mintdish extrage ingredientele, pașii și timpii. Fără introducerea kilometrică.",
  alternates: {
    canonical: "/welcome/ro",
    languages: {
      en: "/welcome",
      ro: "/welcome/ro",
    },
  },
  openGraph: {
    title: "Mintdish — Sari peste blogul culinar. Direct rețeta.",
    description:
      "Lipește un link de rețetă, un clip YouTube sau o poză — Mintdish extrage ingredientele, pașii și timpii. Fără introducerea kilometrică.",
  },
  twitter: {
    title: "Mintdish — Sari peste blogul culinar. Direct rețeta.",
    description:
      "Lipește un link de rețetă, un clip YouTube sau o poză — Mintdish extrage ingredientele, pașii și timpii. Fără introducerea kilometrică.",
  },
};

export default function WelcomeRo() {
  return <Landing locale="ro" />;
}
