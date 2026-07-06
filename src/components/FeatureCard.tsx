import Link from "next/link";

type FeatureCardProps = {
  href: string;
  emoji: string;
  title: string;
  description: string;
};

export default function FeatureCard({
  href,
  emoji,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-orange-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
    >
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 text-xl font-bold text-slate-800 group-hover:text-orange-600">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-orange-500">
        바로가기 →
      </span>
    </Link>
  );
}
