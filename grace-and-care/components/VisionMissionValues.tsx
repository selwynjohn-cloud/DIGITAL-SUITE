/**
 * Drop-in section for graceandcare.co.in
 * Place on the home page after the hero, before "How We Serve".
 *
 * Wire English copy from ../content/en-vision-mission.json into your locale
 * dictionaries (same pattern as hero / pillars).
 */
import type { ReactNode } from "react";

export type CoreValue = { name: string; text: string };

export type VisionMissionCopy = {
  eyebrow: string;
  title: string;
  lede: string;
  vision: { label: string; text: string };
  mission: { label: string; text: string };
  values: { label: string; items: CoreValue[] };
};

type Props = {
  copy: VisionMissionCopy;
};

export function VisionMissionValues({ copy }: Props) {
  return (
    <section
      id="vision-mission"
      className="border-b border-[#102a43]/10 bg-[#f7f3ea]"
      aria-labelledby="vision-mission-heading"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f766e]">
          {copy.eyebrow}
        </p>
        <h2
          id="vision-mission-heading"
          className="font-display mt-3 max-w-3xl text-3xl text-[#102a43] md:text-4xl"
        >
          {copy.title}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#3a555f] md:text-xl">
          {copy.lede}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Statement
            label={copy.vision.label}
            text={copy.vision.text}
            emphasis
          />
          <Statement label={copy.mission.label} text={copy.mission.text} />
        </div>

        <div className="mt-12">
          <h3 className="font-display text-2xl text-[#102a43] md:text-3xl">
            {copy.values.label}
          </h3>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.values.items.map((item) => (
              <li
                key={item.name}
                className="rounded-2xl border border-[#102a43]/10 bg-white/80 p-5 shadow-sm"
              >
                <p className="text-lg font-semibold text-[#0f766e]">{item.name}</p>
                <p className="mt-2 text-base leading-relaxed text-[#3a555f]">
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Statement({
  label,
  text,
  emphasis = false,
}: {
  label: string;
  text: string;
  emphasis?: boolean;
}) {
  return (
    <article
      className={
        emphasis
          ? "rounded-2xl bg-[#102a43] p-6 text-white md:p-8"
          : "rounded-2xl border border-[#c9a227]/50 bg-white p-6 md:p-8"
      }
    >
      <p
        className={
          emphasis
            ? "text-sm font-semibold uppercase tracking-[0.12em] text-[#e8c96a]"
            : "text-sm font-semibold uppercase tracking-[0.12em] text-[#0f766e]"
        }
      >
        {label}
      </p>
      <p
        className={
          emphasis
            ? "font-display mt-3 text-2xl leading-snug md:text-3xl"
            : "font-display mt-3 text-2xl leading-snug text-[#102a43] md:text-3xl"
        }
      >
        {text}
      </p>
    </article>
  );
}

export function defaultEnglishCopy(): VisionMissionCopy {
  return {
    eyebrow: "Who we are",
    title: "Vision, mission & core values",
    lede: "The heart behind Grace and Care — why we serve, and how we choose to serve.",
    vision: {
      label: "Vision",
      text: "Hearts filled with hope. Lives touched by care.",
    },
    mission: {
      label: "Mission",
      text: "To uplift hearts through spiritual music and serve people in need with compassion.",
    },
    values: {
      label: "Core values",
      items: [
        { name: "Faith", text: "Rooted in devotion." },
        { name: "Compassion", text: "See the person. Feel the need." },
        { name: "Service", text: "Turn love into action." },
        { name: "Dignity", text: "Honour every life." },
        { name: "Integrity", text: "Live what we believe." },
      ],
    },
  };
}

/** Optional helper when embedding without the full Next app. */
export function VisionMissionPreview(): ReactNode {
  return <VisionMissionValues copy={defaultEnglishCopy()} />;
}
