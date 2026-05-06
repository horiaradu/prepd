import Link from "next/link";
import { CameraIcon, ExternalLinkIcon, SparklesIcon } from "@/components/icons";
import { WaitlistForm } from "@/components/WaitlistForm";

export function Landing() {
  return (
    <div className="flex-1 flex flex-col">
      <Hero />
      <InputModes />
      <OutputShowcase />
      <Waitlist />
    </div>
  );
}

function Hero() {
  return (
    <section className="px-6 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="space-y-7">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Skip the food blog.
            <br />
            <span className="text-green-600">Just the recipe.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
            Paste a recipe link, drop a YouTube cooking video, or snap a photo.
            Mintdish parses it into clean ingredients, prep steps, and cooking
            times — ready to follow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Sign in
            </Link>
            <a
              href="#waitlist"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-200 font-medium rounded-lg hover:border-green-600 hover:text-green-700 transition-colors"
            >
              Join the waitlist
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-tr from-green-100/60 via-green-50/40 to-transparent blur-2xl -z-10" />
          <ScreenshotFrame
            src="/landing/home-list.png"
            alt="Mintdish recipe list with food photography"
            priority
          />
        </div>
      </div>
    </section>
  );
}

function InputModes() {
  return (
    <section className="px-6 sm:px-8 py-16 sm:py-20 bg-gray-50/60 border-y border-gray-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            From wherever you found it.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            One input, three ways in. Mintdish figures out which kind of source
            you handed it and pulls the recipe out.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <InputModeCard
            badge="Link"
            title="Recipe sites"
            description="Bon Appétit, Serious Eats, Food52, NYT Cooking. Paste the link, get the recipe — without the 2,000-word backstory."
            icon={<ExternalLinkIcon size={28} className="text-green-600" />}
            preview={<BrowserPreview />}
          />
          <InputModeCard
            badge="YouTube"
            title="Cooking videos"
            description="Mintdish reads the transcript, watches what gets cooked, and turns it into step-by-step instructions with ingredients."
            icon={<YouTubeGlyph />}
            preview={<VideoPreview />}
          />
          <InputModeCard
            badge="Photo"
            title="Cookbook pages & screenshots"
            description="Snap a page from a cookbook, screenshot a friend's text, or upload a handwritten card — Mintdish reads it."
            icon={<CameraIcon size={28} className="text-green-600" />}
            preview={<RecipeCardPreview />}
          />
        </div>
      </div>
    </section>
  );
}

function InputModeCard({
  badge,
  title,
  description,
  icon,
  preview,
}: {
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold tracking-wide">
          {badge}
        </span>
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-gray-600 leading-relaxed">{description}</p>
      </div>
      <div className="mt-auto">{preview}</div>
    </div>
  );
}

function BrowserPreview() {
  return (
    <div className="h-32 rounded-lg bg-gray-50 border border-gray-100 p-3 flex flex-col gap-2 overflow-hidden">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-red-300" />
        <span className="w-2 h-2 rounded-full bg-amber-300" />
        <span className="w-2 h-2 rounded-full bg-green-300" />
      </div>
      <div className="rounded bg-white border border-gray-200 px-2 py-1 font-mono text-[10px] text-gray-700 truncate">
        bonappetit.com/recipe/best-chicken-parm
      </div>
      <div className="space-y-1.5 mt-0.5">
        <div className="h-1.5 bg-gray-200 rounded w-3/4" />
        <div className="h-1.5 bg-gray-200 rounded w-full" />
        <div className="h-1.5 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

function VideoPreview() {
  return (
    <div className="h-32 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
          <span
            aria-hidden
            className="block w-0 h-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-white ml-1"
          />
        </div>
      </div>
      <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded truncate">
        Best Chicken Parm Recipe — Bon Appétit
      </div>
    </div>
  );
}

function RecipeCardPreview() {
  return (
    <div className="relative h-32 flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 via-amber-50/60 to-orange-50">
      <div
        className="bg-[#fdf6e3] border border-amber-200/70 rounded shadow-md p-3 w-40 transform -rotate-3"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >
        <div className="text-[13px] font-bold text-amber-900 underline decoration-amber-700/60 underline-offset-2 mb-1.5">
          Aunt Mary&apos;s Lasagna
        </div>
        <ul className="text-[10px] leading-tight text-amber-900/80 space-y-0.5">
          <li>1 lb ground beef</li>
          <li>1 onion, chopped</li>
          <li>2 cups marinara</li>
          <li>9 lasagna noodles</li>
          <li>2 cups ricotta</li>
        </ul>
      </div>
    </div>
  );
}

function YouTubeGlyph() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      aria-hidden
      className="text-green-600"
    >
      <path
        fill="currentColor"
        d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.76C18.25 5 12 5 12 5s-6.25 0-7.84.44A2.5 2.5 0 0 0 2.4 7.2C2 8.78 2 12 2 12s0 3.22.4 4.8a2.5 2.5 0 0 0 1.76 1.76C5.75 19 12 19 12 19s6.25 0 7.84-.44a2.5 2.5 0 0 0 1.76-1.76C22 15.22 22 12 22 12s0-3.22-.4-4.8ZM10 15V9l5 3-5 3Z"
      />
    </svg>
  );
}

function OutputShowcase() {
  return (
    <section className="px-6 sm:px-8 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="lg:order-2 space-y-6">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
            <SparklesIcon size={16} className="text-green-600" />
            <span>Structured, not scraped</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ingredients, steps, and timing — laid out for cooking.
          </h2>
          <ul className="space-y-4 text-gray-600">
            <Bullet title="Per-step ingredients">
              Every step shows exactly which ingredients to grab — no jumping
              back to the top.
            </Bullet>
            <Bullet title="Metric conversions">
              Cups, ounces, sticks of butter — all converted to grams and
              millilitres.
            </Bullet>
            <Bullet title="Timing built in">
              Cooking times surface as badges so you know what&apos;s a
              two-minute task and what&apos;s a forty-minute simmer.
            </Bullet>
            <Bullet title="Scale your servings">
              Bump the serving size and the amounts scale with you.
            </Bullet>
          </ul>
        </div>
        <div className="lg:order-1 relative">
          <div className="absolute -inset-6 bg-gradient-to-br from-green-100/50 via-transparent to-transparent blur-2xl -z-10" />
          <ScreenshotFrame
            src="/landing/recipe-cooking.png"
            alt="A parsed Mintdish recipe with timing badges and per-step ingredient hints"
          />
        </div>
      </div>
    </section>
  );
}

function Bullet({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-2 w-1.5 h-1.5 rounded-full bg-green-600 flex-shrink-0"
      />
      <span>
        <span className="font-semibold text-gray-900">{title}.</span>{" "}
        <span>{children}</span>
      </span>
    </li>
  );
}

function Waitlist() {
  return (
    <section
      id="waitlist"
      className="px-6 sm:px-8 py-16 sm:py-24 bg-green-600 text-white"
    >
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Get on the waitlist.
        </h2>
        <p className="text-lg text-green-50/90">
          Mintdish is invite-only while we tune the parser. Drop your email —
          we&apos;ll keep you in the loop at launch and get you into beta early.
        </p>
        <WaitlistForm />
      </div>
    </section>
  );
}

function ScreenshotFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto block"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
      />
    </div>
  );
}
