import { useEffect, useState } from 'react';

interface Partner {
  name: string;
  logo: string;
  style?: React.CSSProperties;
}

const partners: Partner[] = [
  {
    name: 'Bunisha', logo: '/images/partners/bunisha.png',
    style: { height: "92px" },

  },
  {
    name: 'iLOTBET', logo: '/images/partners/iLOTBET.png',
    style: { height: "95px" },
  },
  {
    name: 'Monsa', logo: '/images/partners/monsa.png',
    style: { height: "44px" },
  },
  {
    name: "AliExpress",
    logo: "/images/partners/AliExpress.svg",
    style: { height: "44px" },
  },
  { name: 'Pollbrand', logo: '/images/partners/pollbrand.png', style: {} },
  { name: 'Radio Group', logo: '/images/partners/radio-group.png', style: {} },
];

export default function PartnerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % partners.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <p className="text-center text-base font-normal text-[#475467] mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Join the list of our amazing partners
      </p>

      {/* Desktop view - all logos visible */}
      <div className="hidden md:flex flex-wrap justify-center items-center gap-6 lg:gap-8">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="rounded-xl flex items-center justify-center min-w-[140px] h-[80px]"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-w-full max-h-full object-contain"
              style={partner.style}
            />
          </div>
        ))}
      </div>

      {/* Mobile view - carousel */}
      <div className="md:hidden relative">
        <div className="flex overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {partners.map((partner) => (
              <div
                key={partner.name}
                className="min-w-full flex justify-center px-4"
              >
                <div className="flex items-center justify-center w-full max-w-[280px] h-[80px] md:h-[100px]">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                    style={partner.style}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {partners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                  ? 'bg-primary w-6'
                  : 'bg-gray-300'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}