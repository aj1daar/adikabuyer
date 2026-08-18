import MainLayout from '../layouts/MainLayout'
import usePageTitle from '../hooks/usePageTitle'

const steps = [
  {
    title: 'Выбери товар',
    description: 'Просмотри каталог и выбери вариант — цвет, размер, объём — который тебе нравится.',
  },
  {
    title: 'Оформи заказ',
    description: 'Добавь товар в корзину, укажи имя, телефон и город — мы получим заказ и свяжемся с тобой.',
  },
  {
    title: 'Получи заказ',
    description: 'Мы соберём твой заказ под тебя и свяжемся, чтобы согласовать доставку.',
  },
]

export default function AboutPage() {
  usePageTitle('О нас')
  return (
    <MainLayout>
      <section className="relative -mx-6 overflow-hidden px-6 py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-bubblegum via-bubblegum-light to-silver blur-3xl opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-silver-dark via-white to-bubblegum-light blur-3xl opacity-50"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          <span className="rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-5 py-1.5 font-grotesk text-sm font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]">
            Наша история
          </span>
          <h1 className="font-grotesk text-display font-semibold text-ink">О нас</h1>
          <p className="max-w-xl px-0 text-lg text-ink/70 sm:px-24">
            <span className="font-grotesk font-bold text-bubblegum-dark">Adika Buyer</span> — это вещи{' '}
            <span className="font-grotesk font-bold text-bubblegum-dark">под заказ</span>, собранные{' '}
            <span className="font-grotesk font-bold text-bubblegum-dark">под тебя</span>, а не с полки.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-grotesk text-2xl font-semibold text-ink">Наша история</h2>
        <p className="mt-4 text-lg leading-relaxed text-ink/70">
          Всё началось с маленького Instagram-аккаунта, куда друзья писали в директ, чтобы заказать
          термостакан нужного цвета. Сегодня Adika Buyer — это каталог термостаканов, одежды, обуви
          и других вещей под заказ, но подход остался прежним: мы собираем именно то, что нужно тебе,
          и держим связь до самой доставки.
        </p>
      </section>

      <section className="relative mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-center font-grotesk text-2xl font-semibold text-ink">Как сделать заказ</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col items-center gap-3 rounded-3xl border-2 border-black p-6 text-center shadow-[6px_6px_0_0_#E8799F]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-grotesk text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="font-grotesk text-lg font-bold text-ink">{step.title}</h3>
              <p className="text-sm text-ink/60">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-2xl rounded-3xl border-2 border-black bg-bubblegum-light p-6 text-center shadow-[6px_6px_0_0_#000]">
          <p className="font-grotesk text-base font-bold text-ink">
            Доставка занимает от 7 до 14 дней
          </p>
          <p className="mt-1 text-sm text-ink/70">
            Заказы едут напрямую из США и Кореи, поэтому сроки зависят от международной доставки.
          </p>
        </div>
      </section>
    </MainLayout>
  )
}
