export function TitledDiv({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  );
}