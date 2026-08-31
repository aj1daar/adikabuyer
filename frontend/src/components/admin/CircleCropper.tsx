import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

type CircleCropperProps = {
  file: File
  title?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

type Point = { x: number; y: number }

const VIEW = 260
const OUTPUT = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 3

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))

/** Mobile-friendly circular photo cropper: drag to pan, pinch or slider to zoom, exports a round PNG. */
export default function CircleCropper({ file, title = 'Кружок цвета', busy, onCancel, onConfirm }: CircleCropperProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const pointers = useRef<Map<number, Point>>(new Map())
  const drag = useRef<{ pointer: Point; offset: Point } | null>(null)
  const pinch = useRef<{ distance: number; zoom: number; mid: Point; offset: Point } | null>(null)
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

  const twoPointers = (): [Point, Point] | null => {
    const values = [...pointers.current.values()]
    return values.length >= 2 ? [values[0], values[1]] : null
  }

  const beginGesture = () => {
    const pair = twoPointers()
    if (pair) {
      const [a, b] = pair
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        offset,
      }
      drag.current = null
      return
    }
    const only = [...pointers.current.values()][0]
    if (only) {
      pinch.current = null
      drag.current = { pointer: only, offset }
    }
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    beginGesture()
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) {
      return
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const pair = twoPointers()
    if (pair && pinch.current) {
      const [a, b] = pair
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      setZoom(clampZoom((pinch.current.zoom * distance) / pinch.current.distance))
      setOffset(
        clamp({
          x: pinch.current.offset.x + (mid.x - pinch.current.mid.x),
          y: pinch.current.offset.y + (mid.y - pinch.current.mid.y),
        })
      )
      return
    }

    if (drag.current) {
      setOffset(
        clamp({
          x: drag.current.offset.x + (event.clientX - drag.current.pointer.x),
          y: drag.current.offset.y + (event.clientY - drag.current.pointer.y),
        })
      )
    }
  }

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    pinch.current = null
    drag.current = null
    beginGesture()
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
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
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
            onChange={(event) => setZoom(clampZoom(Number(event.target.value)))}
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
