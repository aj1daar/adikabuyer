import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type CircleCropperProps = {
  file: File
  title?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

const VIEW = 260
const OUTPUT = 512

/** Mobile-friendly circular photo cropper: drag to pan, slider to zoom, exports a round PNG. */
export default function CircleCropper({ file, title = 'Кружок цвета', busy, onCancel, onConfirm }: CircleCropperProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ pointerX: number; pointerY: number; startX: number; startY: number } | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const baseScale = natural ? VIEW / Math.min(natural.w, natural.h) : 1
  const displayScale = baseScale * zoom
  const displayWidth = natural ? natural.w * displayScale : VIEW
  const displayHeight = natural ? natural.h * displayScale : VIEW

  const clamp = useCallback(
    (next: { x: number; y: number }) => {
      const maxX = Math.max(0, (displayWidth - VIEW) / 2)
      const maxY = Math.max(0, (displayHeight - VIEW) / 2)
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      }
    },
    [displayWidth, displayHeight]
  )

  useEffect(() => {
    setOffset((current) => clamp(current))
  }, [clamp])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, startX: offset.x, startY: offset.y }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) {
      return
    }
    setOffset(
      clamp({
        x: drag.current.startX + (event.clientX - drag.current.pointerX),
        y: drag.current.startY + (event.clientY - drag.current.pointerY),
      })
    )
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const confirm = () => {
    const image = imageRef.current
    if (!image || !natural) {
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    const source = VIEW / displayScale
    const sourceX = natural.w / 2 - offset.x / displayScale - source / 2
    const sourceY = natural.h / 2 - offset.y / displayScale - source / 2
    ctx.drawImage(image, sourceX, sourceY, source, source, 0, 0, OUTPUT, OUTPUT)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath()
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2)
    ctx.fill()
    canvas.toBlob((blob) => {
      if (blob) {
        onConfirm(blob)
      }
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 px-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
        <h3 className="font-grotesk text-base font-bold text-ink">{title}</h3>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-3xl border-2 border-black bg-silver"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {url && (
            <img
              ref={imageRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(event) =>
                setNatural({ w: event.currentTarget.naturalWidth, h: event.currentTarget.naturalHeight })
              }
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: displayWidth,
                height: displayHeight,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_9999px_rgba(255,255,255,0.55)]" />
        </div>

        <label className="flex items-center gap-3">
          <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">Зум</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-2 flex-1 cursor-pointer accent-bubblegum-dark"
            aria-label="Приблизить"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[44px] flex-1 rounded-pill border-2 border-black bg-white px-4 font-grotesk text-sm font-bold text-ink transition hover:bg-silver disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !natural}
            className="min-h-[44px] flex-1 rounded-pill border-2 border-black bg-ink px-4 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark disabled:opacity-40"
          >
            {busy ? 'Загрузка...' : 'Готово'}
          </button>
        </div>
      </div>
    </div>
  )
}
