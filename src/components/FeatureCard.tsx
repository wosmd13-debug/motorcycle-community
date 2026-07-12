import Link from "next/link";

type FeatureCardProps = {
  href: string;
  title: string;
  description: string;
};

export default function FeatureCard({
  href,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-signature/20 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-signature/30 hover:shadow-md"
    >
      <h3 className="text-xl font-bold text-slate-800 group-hover:text-signature-dark">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-signature-dark">
        바로가기
      </span>
    </Link>
  );
}
