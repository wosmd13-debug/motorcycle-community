type PageHeaderProps = {
  title: string;
  description: string;
};

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <section className="portal-panel overflow-hidden">
      <div className="portal-panel-head">
        <h1 className="portal-panel-title">{title}</h1>
        <span className="portal-badge hidden sm:inline-flex">RIDE</span>
      </div>
      <p className="border-l-4 border-signature/30 bg-signature-light/40 px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>
    </section>
  );
}
