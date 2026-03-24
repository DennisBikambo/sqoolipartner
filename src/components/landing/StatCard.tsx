interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  iconAlt: string;
}

export default function StatCard({ icon, label, value, iconAlt }: StatCardProps) {
  return (
    <div className="bg-muted/30 dark:bg-muted/30 rounded-xl overflow-hidden flex flex-col">
      <img
        src={icon}
        alt={iconAlt}
        className="w-full h-44 object-cover"
      />
      <div className="p-6 flex flex-col items-center gap-2">
        <p className="text-base font-normal text-text-gray dark:text-muted-foreground text-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {label}
        </p>
        <p className="text-4xl font-medium text-text-black dark:text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {value}
        </p>
      </div>
    </div>
  );
}