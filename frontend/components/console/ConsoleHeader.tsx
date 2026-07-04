type ConsoleHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function ConsoleHeader({ eyebrow, title, description, action }: ConsoleHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-ink/10 pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="inline-flex rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-graphite shadow-line">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
