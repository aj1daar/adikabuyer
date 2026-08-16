import MainLayout from '../layouts/MainLayout'
import HeroSection from '../components/HeroSection'
import CartDrawer from '../components/CartDrawer'

export default function LandingPage() {
  return (
    <>
      <MainLayout>
        <HeroSection />
      </MainLayout>
      <CartDrawer />
    </>
  )
}
