interface TimelineStepProps {
  number: string;
  title: string;
  description: string;
  showLine?: boolean;
}

export default function TimelineStep({ number, title, description, showLine = true }: TimelineStepProps) {
  return (
    <div className="flex gap-6 items-start">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-[#e8ebfd] dark:bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-[#000000] dark:text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {number}
          </span>
        </div>
        {showLine && (
          <div className="w-px h-16 bg-[#d6d8fc] dark:bg-border"></div>
        )}
      </div>
      <div className="flex-1 pt-2">
        <h3 className="text-xl font-normal text-[#000000] dark:text-foreground mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {title}
        </h3>
        <p className="text-sm font-light text-[#475467] dark:text-muted-foreground leading-relaxed" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {description}
        </p>
      </div>
    </div>
  );
}