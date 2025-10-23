import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Building2, Users, GraduationCap, Rocket, CheckCircle2, Handshake, TrendingUp } from 'lucide-react';

export default function Hero() {
  const [formData, setFormData] = React.useState({
    orgName: '',
    email: '',
    partnershipType: 'Media',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-chart-5/5">
        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Empower Education.<br />
                <span className="text-primary">Inspire Change.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Whether you're a content creator, media hub, or corporate donor — Sqooli gives you a way to make education accessible and rewarding for everyone.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Become a Partner
              </Button>
            </div>
            <div className="relative h-[400px] lg:h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-br from-chart-3/20 via-chart-5/20 to-primary/20 rounded-3xl"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold text-foreground mb-2">The Future of Learning</h3>
                  <div className="flex gap-4 mt-6">
                    <div className="w-24 h-32 bg-gradient-to-br from-chart-3 to-chart-5 rounded-xl"></div>
                    <div className="w-24 h-32 bg-gradient-to-br from-primary to-secondary rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Why Partner with Sqooli?
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Sqooli empowers digital schools to reach new learners through education — Partners help us amplify results, quality, and growth.
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Schools Digitally Transformed</p>
                <p className="text-4xl font-bold text-foreground">100+</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-2xl flex items-center justify-center">
                <Users className="w-10 h-10 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Teachers Empowered</p>
                <p className="text-4xl font-bold text-foreground">500+</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-chart-3/20 to-chart-3/10 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Students Enrolled</p>
                <p className="text-4xl font-bold text-foreground">18K+</p>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-chart-5/20 to-chart-5/10 rounded-2xl flex items-center justify-center">
                <Rocket className="w-10 h-10 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Partner Campaigns Launched</p>
                <p className="text-4xl font-bold text-foreground">18K+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Types Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Marketing Partners */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 lg:p-12 border border-primary/20">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Marketing Partners (Media & Influencers)
              </h3>
              <p className="text-muted-foreground mb-6">
                If you create digital content or have an audience, we can work together to build creative campaigns that both grow your reach and give back to learning.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Co-create video campaigns and brand activations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Amplify your brand while supporting education</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Access student audiences and social impact</span>
                </li>
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Join As a Media Partner
              </Button>
            </div>

            {/* Impact Partners */}
            <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-3xl p-8 lg:p-12 border border-secondary/20">
              <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6">
                <Handshake className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Impact Partners (Corporate Sponsors & Donors)
              </h3>
              <p className="text-muted-foreground mb-6">
                Your sponsorship or donation directly powers student scholarships, teacher training, and access to quality digital learning tools.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Sponsor digital learning tools for underserved schools</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Empower educators through capacity-building programs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">Receive transparent impact reports and recognition</span>
                </li>
              </ul>
              <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                Become a Donor
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm text-muted-foreground mb-2">Join 100+ of our amazing partners</p>
            <div className="flex flex-wrap justify-center items-center gap-8 mt-8">
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <span className="text-lg font-semibold text-foreground">Boltshift</span>
              </div>
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <span className="text-lg font-semibold text-foreground">Lightbox</span>
              </div>
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <span className="text-lg font-semibold text-foreground">FeatherDev</span>
              </div>
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <span className="text-lg font-semibold text-foreground">Spherule</span>
              </div>
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <span className="text-lg font-semibold text-foreground">GlobalBank</span>
              </div>
              <div className="px-6 py-3 bg-background rounded-xl border border-border">
                <span className="text-lg font-semibold text-foreground">Nietszche</span>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-foreground mt-20 mb-12">
            How it works
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            It's easy. Here is a 3-step visual that explains how to invest by partnering with us.
          </p>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">1</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Apply to Partner</h3>
                <p className="text-muted-foreground">
                  Submit your details through our simple partner portal, specifying your goals and preferred model of partnership.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-secondary">2</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Approval & Onboarding</h3>
                <p className="text-muted-foreground">
                  Our team will reach out within 48 hours to set up an onboarding dashboard and design a tailored partnership strategy.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-chart-3/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-chart-3">3</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Promote, Fund & Collaborate</h3>
                <p className="text-muted-foreground">
                  You choose your involvement level: run campaigns, donate digital tools, or sponsor impact reports. We take care of the logistics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Ready to Make an Impact?
                </h2>
                <span className="text-3xl">✨</span>
              </div>
              <p className="text-lg text-muted-foreground mb-8">
                Join our growing community of partners who are transforming education across Africa. Let's create lasting change together.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    placeholder="Organization Name"
                    value={formData.orgName}
                    onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                    className="bg-background"
                  />
                </div>
                
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-background"
                  />
                </div>

                <div>
                  <select
                    value={formData.partnershipType}
                    onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  >
                    <option value="Media">Media</option>
                    <option value="Influencer">Influencer</option>
                    <option value="Sponsor">Sponsor</option>
                    <option value="Donor">Donor</option>
                  </select>
                </div>

                <div>
                  <textarea
                    placeholder="Message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground resize-none"
                  />
                </div>

                <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Submit Form
                </Button>
              </form>
            </div>

            <div className="relative h-[500px] hidden lg:block">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-chart-3/30 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-chart-5/30 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full max-w-md">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-64 h-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                      <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center space-y-4">
                          <div className="w-32 h-40 mx-auto bg-gradient-to-br from-chart-3 via-primary to-chart-5 rounded-xl"></div>
                          <p className="text-sm font-medium text-muted-foreground">Building the future together</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}