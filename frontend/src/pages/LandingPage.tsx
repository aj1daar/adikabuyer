import MainLayout from '../layouts/MainLayout'
import HeroSection from '../components/HeroSection'
import usePageTitle from '../hooks/usePageTitle'

export default function LandingPage() {
  usePageTitle()
  return (
    <MainLayout>
      <HeroSection />
    </MainLayout>
  )
}
