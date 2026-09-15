import MainLayout from '../layouts/MainLayout'
import NotFoundState from '../components/NotFoundState'
import usePageTitle from '../hooks/usePageTitle'

export default function NotFoundPage() {
  usePageTitle('Страница не найдена')
  return (
    <MainLayout>
      <NotFoundState />
    </MainLayout>
  )
}
