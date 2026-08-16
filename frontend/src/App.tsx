import MainLayout from './layouts/MainLayout'
import HeroSection from './components/HeroSection'
import ProductGrid from './components/ProductGrid'
import CartDrawer from './components/CartDrawer'
import useCatalog from './hooks/useCatalog'

function App() {
  const { products, loading, error } = useCatalog()

  return (
    <>
      <MainLayout>
        <HeroSection />

        <div className="py-12">
          {loading && <p className="text-ink/60">Loading products...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className="text-ink/60">No products available.</p>
          )}
          {!loading && !error && products.length > 0 && <ProductGrid products={products} />}
        </div>
      </MainLayout>
      <CartDrawer />
    </>
  )
}

export default App
