import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Megaphone, Handshake } from 'lucide-react';
import StatCard from '../components/landing/StatCard';
import PartnershipCard from '../components/landing/PartnershipCard';
import TimelineStep from '../components/landing/TimelineStep';
import Footer from '../components/landing/Footer';
import PartnerCarousel from '../components/landing/PartnerCarousel';
import { HeroHeader } from '../components/layout/HeroHeader';
import { useTheme } from '../hooks/useTheme';

export default function Hero() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const scrollToForm = () => {
    const formSection = document.getElementById('partner-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const [formData, setFormData] = useState({
    orgName: '',
    email: '',
    partnershipType: 'Media',
    message: ''
  });
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!formData.orgName.trim()) {
      setResult("validation");
      return;
    }

    if (!formData.email.trim()) {
      setResult("validation");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setResult("validation");
      return;
    }

    if (!formData.message.trim()) {
      setResult("validation");
      return;
    }

    setIsSubmitting(true);
    setResult("");

    const submitData = new FormData();
    submitData.append("access_key", "2313b8a5-6438-473f-acb4-8f4cd0df5926");
    submitData.append("name", formData.orgName);
    submitData.append("email", formData.email);
    submitData.append("partnership_type", formData.partnershipType);
    submitData.append("message", formData.message);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: submitData
      });

      const data = await response.json();

      if (data.success) {
        setResult("success");
        setFormData({
          orgName: '',
          email: '',
          partnershipType: 'Media',
          message: ''
        });
      } else {
        setResult("error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setResult("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      {/* Navigation Bar */}
      <HeroHeader />

      {/* Hero Section */}
      <section className={isDark 
        ? "relative overflow-hidden bg-gradient-to-br from-[#1a1f2e] via-[#2a1f2e] to-[#1a202e] pt-4 pb-8"
        : "relative overflow-hidden bg-gradient-to-br from-[#eef6fc] via-[#fbeefc] to-[#eef1fc] pt-4 pb-8"
      }>
        <div className="max-w-7xl mx-auto px-6 lg:pl-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-medium text-[#101828] dark:text-foreground leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Empower Education.<br />
                <span className="text-primary">Inspire Change.</span>
              </h1>
              <p className="text-lg lg:text-xl font-light text-[#111111] dark:text-muted-foreground leading-relaxed max-w-xl" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Whether you're a content creator, media brand, or corporate donor — Sqooli gives you a way to make education accessible and rewarding for everyone.
              </p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-medium text-lg px-8 py-6 rounded-lg"
                style={{ fontFamily: 'Outfit, sans-serif' }}
                onClick={scrollToForm}
              >
                Become a Partner
              </Button>
            </div>
            
            <div className="hidden relative h-full md:w-[120%] md:flex justify-start">
              {/* Decorative blob SVGs in background - behind everything */}
              <div className="relative rounded-2xl overflow-visible h-full" style={{ zIndex: 1 }}>
                {/* Main hero image */}
                <div className="relative bottom-4 w-full h-full">
                  <img
                    src="/images/landing/hero.png"
                    alt="Children learning"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 lg:py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-medium text-[#101828] dark:text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Why Partner with Sqooli
            </h2>
            <p className="text-base font-light text-[#475467] dark:text-muted-foreground max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Sqooli empowers digital schools to reach more learners through innovation. Partners help us amplify access, visibility, and opportunity.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon="/school-building.svg"
              label="Schools Digitally Transformed"
              value="100+"
              iconAlt="School building"
            />
            <StatCard
              icon="/teacher-illustration.svg"
              label="Teachers Empowered"
              value="500+"
              iconAlt="Teacher"
            />
            <StatCard
              icon="/student-illustration.svg"
              label="Students Reached"
              value="18K+"
              iconAlt="Student"
            />
            <StatCard
              icon="/scholarship-illustration.svg"
              label="Running Scholarships"
              value="18K+"
              iconAlt="Scholarships"
            />
          </div>
        </div>
      </section>

      {/* Partnership Types Section */}
      <section className="py-16 lg:py-20 bg-[#f8fafc] dark:bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-6">
            <PartnershipCard
              icon={<Megaphone className="w-8 h-8" />}
              title="Marketing Partners (Media & Influencers)"
              description="Marketing is at the cornerstone of our outreach. Media and Influencer partners stand to get perks including"
              benefits={[
                "Earn commission for every school or student you bring on board",
                "Access affiliate dashboard and campaign tools",
                "Co-branded media kits, webinars, and educational challenges"
              ]}
              buttonText="Join the Sqooli Affiliate Program"
              variant="primary"
              onButtonClick={scrollToForm}
            />

            <PartnershipCard
              icon={<Handshake className="w-8 h-8" />}
              title="Impact Partners (Corporate Sponsors & Donors)"
              description="Join us in impacting the future of education through your donations and scholarship for disadvantaged students."
              benefits={[
                "Support digital learning through scholarships for students",
                "Support CSR programs that fund community schools",
                "Receive transparent impact reports and recognition"
              ]}
              buttonText="Support Digital Education"
              variant="secondary"
              onButtonClick={scrollToForm}
            />
          </div>
        </div>
      </section>

      {/* Partner Logos Section */}
      <section className="py-12 lg:py-16 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <PartnerCarousel />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 lg:py-20 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="text-center mb-12 lg:mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-medium text-[#101828] dark:text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              How it works
            </h2>
            <p className="text-base font-light text-[#475467] dark:text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Its easy. Here is a 3 step visual timeline of what to expect by partnering with us
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-0">
            <TimelineStep
              number="1"
              title="Apply to Partner"
              description="Reach out to our team to be a partner through our contacts"
              showLine={true}
            />
            <TimelineStep
              number="2"
              title="Approval & Onboarding"
              description="Get your account created and access to your personalized dashboard based on type of partnership"
              showLine={true}
            />
            <TimelineStep
              number="3"
              title="Promote,  Fund & Collaborate"
              description="Track your earnings (marketing partners) and impact (impact partners) on your dashboard"
              showLine={false}
            />
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section
        id="partner-form"
        className={isDark
          ? "py-16 lg:py-20 bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] relative overflow-hidden"
          : "py-16 lg:py-20 bg-gradient-to-br from-[#eef6fc] via-white to-[#eef1fc] relative overflow-hidden"
        }
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl lg:text-4xl font-medium text-[#101828] dark:text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Ready to Make an Impact?
                </h2>
                <span className="text-3xl">✨</span>
              </div>
              <p className="text-base font-light text-[#475467] dark:text-muted-foreground mb-8" style={{ fontFamily: 'Lexend, sans-serif' }}>
                Join the Sqooli Partners Network today.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-sm font-normal text-[#475467] dark:text-muted-foreground" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Organization Name
                  </Label>
                  <Input
                    id="orgName"
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    className="bg-[#eceefd] dark:bg-input border-[#dfe2fc] dark:border-border rounded-xl h-12"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-normal text-[#475467] dark:text-muted-foreground" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-[#eceefd] dark:bg-input border-[#dfe2fc] dark:border-border rounded-xl h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-normal text-[#475467] dark:text-muted-foreground" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Type of Partnership
                  </Label>
                  <RadioGroup
                    value={formData.partnershipType}
                    onValueChange={(value) => setFormData({ ...formData, partnershipType: value })}
                    className="flex flex-wrap gap-4"
                  >
                    {['Media', 'Influencer', 'Sponsor', 'Donor'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={type} 
                          id={type}
                          className="border-[#d0d5dd] dark:border-border"
                        />
                        <Label 
                          htmlFor={type} 
                          className="text-sm font-normal text-[#475467] dark:text-muted-foreground cursor-pointer"
                          style={{ fontFamily: 'Outfit, sans-serif' }}
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-normal text-[#475467] dark:text-muted-foreground" style={{ fontFamily: 'Lexend, sans-serif' }}>
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-[#eceefd] dark:bg-input border-[#dfe2fc] dark:border-border rounded-xl resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white font-medium text-sm px-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {isSubmitting ? 'Submitting...' : 'Become a Partner'}
                </Button>

                {result === "validation" && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      ⚠ Please fill in all required fields with valid information.
                    </p>
                  </div>
                )}

                {result === "success" && (
                  <div className="p-4  dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                    <p className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      ✓ Thank you! Your application has been submitted successfully. We'll get back to you soon.
                    </p>
                  </div>
                )}

                {result === "error" && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-800 dark:text-red-400 font-medium" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      ✗ Something went wrong. Please try again or contact us directly.
                    </p>
                  </div>
                )}
              </form>
            </div>


            <div className="hidden md:flex relative h-[500px] items-center justify-end">
              <img 
                src="/images/landing/contact-us-bg.png" 
                alt="Contact us" 
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}