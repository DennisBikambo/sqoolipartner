import { CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { ReactNode } from 'react';

interface PartnershipCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  benefits: string[];
  buttonText: string;
  variant: 'primary' | 'secondary';
  onButtonClick?: () => void;
}

export default function PartnershipCard({
  icon,
  title,
  description,
  benefits,
  buttonText,
  variant,
  onButtonClick
}: PartnershipCardProps) {
  const bgGradient = variant === 'primary' 
    ? 'from-[#e2f2f9] to-[#e2f2f9] dark:from-primary/10 dark:to-primary/10' 
    : 'from-[#d1f4e0] to-[#d1f4e0] dark:from-secondary/10 dark:to-secondary/10';
  
  const iconBg = variant === 'primary' ? 'bg-[#e2f2f9] dark:bg-primary/20' : 'bg-[#d1f4e0] dark:bg-secondary/20';
  const iconColor = variant === 'primary' ? 'text-primary' : 'text-secondary';
  const buttonBg = variant === 'primary' ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90';

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-3xl p-8 lg:p-10 border border-transparent dark:border-border/50 flex flex-col gap-6`}>
      <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center`}>
        <div className={iconColor}>
          {icon}
        </div>
      </div>
      
      <h3 className="text-2xl lg:text-3xl font-medium text-[#101828] dark:text-foreground leading-snug" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {title}
      </h3>
      
      <p className="text-base font-light text-[#475467] dark:text-muted-foreground leading-relaxed" style={{ fontFamily: 'Outfit, sans-serif' }}>
        {description}
      </p>
      
      <ul className="space-y-3">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
            <span className="text-sm font-normal text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {benefit}
            </span>
          </li>
        ))}
      </ul>
      
      <Button
        className={`w-full ${buttonBg} text-white font-medium text-sm rounded-full`}
        style={{ fontFamily: 'Outfit, sans-serif' }}
        onClick={onButtonClick}
      >
        {buttonText}
      </Button>
    </div>
  );
}