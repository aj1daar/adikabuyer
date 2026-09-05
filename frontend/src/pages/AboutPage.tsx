import { motion, useReducedMotion } from 'framer-motion'
import MainLayout from '../layouts/MainLayout'
import StepCard, { type StepCloud } from '../components/StepCard'
import ScribbleNote from '../components/ScribbleNote'
import HeroBubbles from '../components/HeroBubbles'
import WeightTariffNote from '../components/WeightTariffNote'
import { popIn } from '../utils/motion'
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
    description: 'Добавь в корзину, укажи имя и телефон.',
    clouds: [
      { text: 'имя · телефон', className: 'right-full top-0 mr-3 -rotate-2' },
      { text: 'оплата при оформлении', className: 'right-full top-1/2 mr-6 -translate-y-1/2 rotate-2' },
      { text: 'мы с вами свяжемся', className: 'right-full bottom-0 mr-3 -rotate-3' },
    ],
  },
  {
    title: 'Получи заказ',
    description: 'Соберём под тебя и согласуем доставку.',
    clouds: [
      { text: 'по Бишкеку — 300 сом', className: 'right-full top-0 mr-3 rotate-2' },
      { text: 'или самовывоз', className: 'right-full top-1/2 mr-5 -translate-y-1/2 -rotate-2' },
      { text: 'плюс вес посылки', className: 'right-full bottom-0 mr-3 rotate-3' },
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
            <motion.div {...popIn(0)} className="relative">
              <span className="rounded-pill border-2 border-black bg-gradient-to-r from-bubblegum to-bubblegum-light px-5 py-1.5 font-grotesk text-sm font-bold uppercase tracking-wider text-ink shadow-[3px_3px_0_0_#000]">
                наша история
              </span>
              <ScribbleNote
                text="с 2021 года"
                className="bottom-full left-1/2 mb-2 -translate-x-1/2"
                direction="down"
                reduceMotion={reduceMotion}
              />
              <HeroBubbles overlay bubbles={[{ text: 'с 2021 года', rotate: -4, className: '-top-3 -right-3' }]} />
            </motion.div>

            <motion.h1
              {...popIn(0.06)}
              className="font-grotesk text-display font-semibold leading-[0.95] tracking-[-0.03em] text-ink sm:text-[clamp(3rem,6.5vw,5rem)]"
            >
              О нас
            </motion.h1>

            <motion.p {...popIn(0.12)} className="max-w-md text-lg text-ink/70">
              <span className="font-bold text-bubblegum-dark">Adika Buyer</span> — это вещи{' '}
              <span className="font-bold text-bubblegum-dark">под заказ</span>, собранные{' '}
              <span className="font-bold text-bubblegum-dark">под тебя</span>, а не с полки.
            </motion.p>

            <motion.div {...popIn(0.18)} className="relative mt-2 inline-block">
              <h2 className="font-grotesk text-xl font-bold text-ink">Наша история</h2>
              <ScribbleNote
                text="из директа"
                className="left-full top-1/2 ml-3 -translate-y-1/2 rotate-2"
                direction="left"
                gap="gap-2"
                reduceMotion={reduceMotion}
              />
              <HeroBubbles
                overlay
                bubbles={[{ text: 'из директа 📩', tone: 'pink', rotate: 4, className: '-top-3 -right-3' }]}
              />
            </motion.div>

            <motion.p {...popIn(0.22)} className="max-w-md text-base leading-relaxed text-ink/60">
              Всё началось с маленького Instagram-аккаунта, куда друзья писали в директ за
              термостаканом нужного цвета. Сегодня это каталог одежды, обуви и посуды — но подход
              прежний: собираем именно то, что нужно тебе, и держим связь до самой доставки.
            </motion.p>
          </div>

          {/* right — how it works, shoved to the other edge */}
          <div className="flex flex-col gap-4 sm:items-end">
            <motion.div {...popIn(0.1)} className="relative inline-block">
              <h2 className="font-grotesk text-xl font-bold text-ink">Как сделать заказ</h2>
              <ScribbleNote
                text="это быстро"
                className="right-full top-1/2 mr-3 -translate-y-1/2 -rotate-2"
                direction="right"
                gap="gap-2"
                reduceMotion={reduceMotion}
              />
              <HeroBubbles
                overlay
                bubbles={[{ text: 'это быстро ⚡', rotate: -4, className: '-top-3 -left-3' }]}
              />
            </motion.div>
            <ol className="flex w-full max-w-sm flex-col gap-3">
              {steps.map((step, index) => (
                <StepCard
                  key={step.title}
                  index={index + 1}
                  title={step.title}
                  description={step.description}
                  clouds={step.clouds}
                  reduceMotion={reduceMotion}
                  entranceDelay={0.16 + index * 0.07}
                />
              ))}
            </ol>
            <motion.div
              {...popIn(0.16 + steps.length * 0.07)}
              className="w-full max-w-sm rounded-2xl border-2 border-black bg-bubblegum-light p-4 text-center shadow-[4px_4px_0_0_#000]"
            >
              <p className="font-grotesk text-sm font-bold text-ink">Доставка 7–14 дней</p>
              <p className="mt-0.5 text-xs text-ink/70">
                Заказы едут напрямую из США и Кореи. По Бишкеку — 300 сом, самовывоз — бесплатно.
              </p>
              <WeightTariffNote className="mt-2" label="Плюс вес посылки" />
            </motion.div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
