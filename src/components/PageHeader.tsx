type PageHeaderProps = {
  emoji: string;
  title: string;
  description: string;
};

export default function PageHeader({ emoji, title, description }: PageHeaderProps) {
  return (
    <section className="rounded-3xl bg-gradient-to-r from-orange-400 to-amber-300 px-6 py-8 text-white shadow-lg sm:px-8">
      <p className="text-4xl">{emoji}</p>
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">
        {description}
      </p>
    </section>
  );
}
