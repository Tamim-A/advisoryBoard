import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import HowItWorks from '@/components/HowItWorks'
import AdvisorsSection from '@/components/AdvisorsSection'
import WhyUsSection from '@/components/WhyUsSection'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'

function OrbBackground() {
  return (
    <div className="orb-container">
      <div className="orb-gold" />
      <div className="orb-blue" />
      <div className="orb-center" />
      <div className="grid-overlay" />
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <OrbBackground />
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <AdvisorsSection />
      <WhyUsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
