import { JsonLd } from "@/components/JsonLd";
import { getFaqContent } from "@/lib/faq";
import {
  breadcrumbStructuredData,
  faqStructuredData,
} from "@/lib/structured-data";
import type { Locale } from "@/lib/i18n";

export function FaqPage({ locale }: { locale: Locale }) {
  const { title, intro, questions } = getFaqContent(locale);
  const homeLabel = locale === "ro" ? "Acasă" : "Home";
  const homeUrl = locale === "ro" ? "/welcome/ro" : "/welcome";
  const faqUrl = locale === "ro" ? "/faq/ro" : "/faq";

  return (
    <>
      <JsonLd data={faqStructuredData(questions)} />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: homeLabel, url: homeUrl },
          { name: title, url: faqUrl },
        ])}
      />
      <section className="px-6 sm:px-8 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto space-y-10">
          <header className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-lg text-gray-600">{intro}</p>
          </header>
          <dl className="space-y-8">
            {questions.map(({ question, answer }) => (
              <div key={question} className="space-y-2">
                <dt className="text-lg font-semibold text-gray-900">
                  {question}
                </dt>
                <dd className="text-gray-600 leading-relaxed">{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
