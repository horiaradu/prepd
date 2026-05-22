import type { Metadata } from "next";
import { FaqPage } from "@/components/FaqPage";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about how Mintdish parses recipes from links, YouTube videos, and photos, what it costs, and how to join the beta.",
  alternates: {
    canonical: "/faq",
    languages: {
      en: "/faq",
      ro: "/faq/ro",
      "x-default": "/faq",
    },
  },
  openGraph: {
    title: "FAQ — Mintdish",
    description:
      "Answers about how Mintdish parses recipes from links, YouTube videos, and photos, what it costs, and how to join the beta.",
  },
  twitter: {
    title: "FAQ — Mintdish",
    description:
      "Answers about how Mintdish parses recipes from links, YouTube videos, and photos, what it costs, and how to join the beta.",
  },
};

export default function Faq() {
  return <FaqPage locale="en" />;
}
