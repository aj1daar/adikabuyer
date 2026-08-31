import { useReducedMotion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import StepCard, { type StepCloud } from '../components/StepCard'
import usePageTitle from '../hooks/usePageTitle'

type Step = { title: string; description: string; clouds: StepCloud[] }

const steps: Step[] = [
  {
    title: 'Выбери товар',
    description: 'Открой каталог и выбери вариант — цвет, размер, объём.',
    clouds: [
      { text: 'цвет · размер · объём', className: 'right-full top-0 mr-3 -rotate-3' },
      { text: 'фото под каждый вариант', className: 'right-full top-1/2 mr-6 -translate-y-1/2 rotate-2' },
      { text: 'sold out видно сразу', className: 'right-full bottom-0 mr-3 rotate-3' },
    ],
  },
  {
    title: 'Оформи заказ',
    description: 'Добавь в корзину, укажи имя, телефон и город.',
    clouds: [
      { text: 'имя · телефон · город', className: 'right-full top-0 mr-3 -rotate-2' },
      { text: 'оплата при оформлении', className: 'right-full top-1/2 mr-6 -translate-y-1/2 rotate-2' },
      { text: 'мы с вами свяжемся', className: 'right-full bottom-0 mr-3 -rotate-3' },
    ],
  },
  {
    title: 'Получи заказ',
    description: 'Соберём под тебя и согласуем доставку.',
    clouds: [
      { text: 'доставка по Бишкеку', className: 'right-full top-0 mr-3 rotate-2' },
      { text: 'по всему КР — с доплатой', className: 'right-full top-1/2 mr-5 -translate-y-1/2 -rotate-2' },
      { text: 'через Яндекс Доставку', className: 'right-full bottom-0 mr-3 rotate-3' },
    ],
  },
]

export default function AboutPage() {
  usePageTitle('О нас')
  const reduceMotion = useReducedMotion()

  return (
    <MainLayout>
      <section className="relative flex items-center py-16 sm:h-[calc(100dvh-10rem)] sm:overflow-hidden sm:py-0">
        <div className="mx-auto grid w-full max-w-6xl gap-10 sm:grid-cols-[1.05fr_0.95fr] sm:items-center sm:gap-16">
          {/* left — the story, shoved to the edge */}
          <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
            <span className="rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-5 py-1.5 font-grotesk text-sm font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]">
              наша история
            </span>
            <h1 className="font-grotesk text-display font-semibold leading-[0.95] tracking-[-0.03em] text-ink sm:text-[clamp(3rem,6.5vw,5rem)]">
              О нас
            </h1>
            <p className="max-w-md text-lg text-ink/70">
              <span className="font-bold text-bubblegum-dark">Adika Buyer</span> — это вещи{' '}
              <span className="font-bold text-bubblegum-dark">под заказ</span>, собранные{' '}
              <span className="font-bold text-bubblegum-dark">под тебя</span>, а не с полки.
            </p>
            <h2 className="mt-2 font-grotesk text-xl font-bold text-ink">Наша история</h2>
            <p className="max-w-md text-base leading-relaxed text-ink/60">
              Всё началось с маленького Instagram-аккаунта, куда друзья писали в директ за
              термостаканом нужного цвета. Сегодня это каталог одежды, обуви и посуды — но подход
              прежний: собираем именно то, что нужно тебе, и держим связь до самой доставки.
            </p>
          </div>

          {/* right — how it works, shoved to the other edge */}
          <div className="flex flex-col gap-4 sm:items-end">
            <h2 className="font-grotesk text-xl font-bold text-ink">Как сделать заказ</h2>
            <ol className="flex w-full max-w-sm flex-col gap-3">
              {steps.map((step, index) => (
                <StepCard
                  key={step.title}
                  index={index + 1}
                  title={step.title}
                  description={step.description}
                  clouds={step.clouds}
                  reduceMotion={reduceMotion}
                />
              ))}
            </ol>
            <div className="w-full max-w-sm rounded-2xl border-2 border-black bg-bubblegum-light p-4 text-center shadow-[4px_4px_0_0_#000]">
              <p className="font-grotesk text-sm font-bold text-ink">Доставка 7–14 дней</p>
              <p className="mt-0.5 text-xs text-ink/70">Заказы едут напрямую из США и Кореи.</p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
