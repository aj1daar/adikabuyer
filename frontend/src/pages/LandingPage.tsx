import MainLayout from '../layouts/MainLayout'
import HeroSection from '../components/HeroSection'
import CartDrawer from '../components/CartDrawer'
import usePageTitle from '../hooks/usePageTitle'

export default function LandingPage() {
  usePageTitle()
  return (
    <>
      <MainLayout>
        <HeroSection />
      </MainLayout>
      <CartDrawer />
    </>
  )
}
