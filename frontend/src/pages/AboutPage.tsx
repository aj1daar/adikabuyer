import MainLayout from '../layouts/MainLayout'

const steps = [
  {
    title: 'Выбери товар',
    description: 'Просмотри каталог и выбери вариант — цвет, размер, объём — который тебе нравится.',
  },
  {
    title: 'Оформи заказ',
    description: 'Добавь товар в корзину, укажи имя, телефон и город — заказ уйдёт прямо в WhatsApp.',
  },
  {
    title: 'Получи заказ',
    description: 'Мы соберём твой заказ под тебя и свяжемся, чтобы согласовать доставку.',
  },
]

export default function AboutPage() {
  return (
    <MainLayout>
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-bubblegum via-bubblegum-light to-silver blur-3xl opacity-50"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-silver-dark via-white to-bubblegum-light blur-3xl opacity-50"
        />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <span className="rounded-pill bg-bubblegum-light px-4 py-1 text-sm font-medium text-bubblegum-dark">
            О нас
          </span>
          <h1 className="font-grotesk text-display font-semibold text-ink">О нас</h1>
          <p className="max-w-xl text-lg text-ink/70">
            Adika Buyer — это вещи под заказ, собранные под тебя, а не с полки.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-3xl px-6 py-12 text-center">
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
              className="flex flex-col items-center gap-3 rounded-3xl border border-ink/10 p-6 text-center"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="font-grotesk text-lg font-semibold text-ink">{step.title}</h3>
              <p className="text-sm text-ink/60">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </MainLayout>
  )
}
