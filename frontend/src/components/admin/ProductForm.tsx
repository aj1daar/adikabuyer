import { useId, useState, type ChangeEvent } from 'react'
import type { ProductDto, VariantStatus } from '../../types/catalog'
import type { ProductPayload, VariantPayload } from '../../types/admin'
import uploadMedia from '../../api/media'
import formatPrice from '../../utils/formatPrice'
import previewDisplayPrice from '../../utils/priceCommission'
import {
  ATTRIBUTE_KEY_OPTIONS,
  ATTRIBUTE_VALUE_OPTIONS,
  attributeKeyLabel,
  COLOR_ATTRIBUTE_KEY,
  CUSTOM_ATTRIBUTE_KEY,
  VOLUME_ATTRIBUTE_KEY,
} from '../../utils/attributeOptions'
import OptionDropdown from '../OptionDropdown'
import CircleCropper from './CircleCropper'

const KNOWN_ATTRIBUTE_KEYS = ATTRIBUTE_KEY_OPTIONS.map((option) => option.value).filter(
  (value) => value !== CUSTOM_ATTRIBUTE_KEY
)

function findDuplicateAttribute(rows: AttributeRow[]): string | null {
  const seen = new Set<string>()
  for (const row of rows) {
    const key = row.key.trim()
    if (key === '') {
      continue
    }
    if (seen.has(key)) {
      return key
    }
    seen.add(key)
  }
  return null
}

type AttributeRow = {
  key: string
  value: string
  customKey: boolean
}

type VariantDraft = {
  id?: number
  sku: string
  priceOverride: string
  stockQuantity: string
  active: boolean
  imageUrls: string[]
  attributes: AttributeRow[]
  status: VariantStatus
}

const STATUS_TOGGLE: { value: VariantStatus; label: string }[] = [
  { value: 'IN_STOCK', label: 'В наличии' },
  { value: 'PRE_ORDER', label: 'Под заказ' },
  { value: 'SOLD_OUT', label: 'Солдаут' },
]

type ProductFormProps = {
  product?: ProductDto
  onSubmit: (payload: ProductPayload) => void
  onClose: () => void
  isSubmitting?: boolean
}

function toAttributeRows(attributes: Record<string, unknown>): AttributeRow[] {
  return Object.entries(attributes).map(([key, value]) => ({
    key,
    value: String(value),
    customKey: !KNOWN_ATTRIBUTE_KEYS.includes(key),
  }))
}

function toVariantDraft(product?: ProductDto): VariantDraft[] {
  if (!product) {
    return []
  }
  return product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    priceOverride: variant.priceOverride?.toString() ?? '',
    stockQuantity: variant.stockQuantity.toString(),
    active: variant.active,
    imageUrls: [...variant.imageUrls],
    attributes: toAttributeRows(variant.attributes),
    status: variant.status,
  }))
}

export default function ProductForm({ product, onSubmit, onClose, isSubmitting }: ProductFormProps) {
  const imageUploadId = useId()
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [active, setActive] = useState(product?.active ?? true)
  const [variants, setVariants] = useState<VariantDraft[]>(toVariantDraft(product))
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState<number | null>(null)
  const [variantUploadError, setVariantUploadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [colorSwatches, setColorSwatches] = useState<Record<string, string>>(product?.colorSwatches ?? {})
  const [cropper, setCropper] = useState<{ color: string; file: File } | null>(null)
  const [swatchUploading, setSwatchUploading] = useState(false)

  const colorValues = Array.from(
    new Set(
      variants
        .flatMap((variant) => variant.attributes)
        .filter((attribute) => attribute.key === COLOR_ATTRIBUTE_KEY && attribute.value.trim() !== '')
        .map((attribute) => attribute.value)
    )
  )

  const handleSwatchFileSelected = (color: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) {
      setCropper({ color, file })
    }
  }

  const handleCropperConfirm = async (blob: Blob) => {
    if (!cropper) {
      return
    }
    setSwatchUploading(true)
    setVariantUploadError(null)
    try {
      const response = await uploadMedia(new File([blob], 'swatch.png', { type: 'image/png' }))
      setColorSwatches((current) => ({ ...current, [cropper.color]: response.url }))
      setCropper(null)
    } catch (err) {
      setVariantUploadError(err instanceof Error ? err.message : 'Не удалось загрузить кружок.')
    } finally {
      setSwatchUploading(false)
    }
  }

  const handleVariantImageSelected = async (
    variantIndex: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setUploadingVariantIndex(variantIndex)
    setVariantUploadError(null)

    try {
      const response = await uploadMedia(file)
      updateVariant(variantIndex, {
        imageUrls: [...variants[variantIndex].imageUrls, response.url],
      })
    } catch (err) {
      setVariantUploadError(err instanceof Error ? err.message : 'Не удалось загрузить изображение.')
    } finally {
      setUploadingVariantIndex(null)
    }
  }

  const addVariant = () => {
    setVariants([
      ...variants,
      { sku: '', priceOverride: '', stockQuantity: '0', active: true, imageUrls: [], attributes: [], status: 'IN_STOCK' },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)))
  }

  const setVariantStatus = (index: number, status: VariantDraft['status']) => {
    updateVariant(index, status === 'PRE_ORDER' ? { status, stockQuantity: '0' } : { status })
  }

  const addAttribute = (variantIndex: number) => {
    updateVariant(variantIndex, {
      attributes: [...variants[variantIndex].attributes, { key: '', value: '', customKey: false }],
    })
  }

  const removeAttribute = (variantIndex: number, attributeIndex: number) => {
    updateVariant(variantIndex, {
      attributes: variants[variantIndex].attributes.filter((_, i) => i !== attributeIndex),
    })
  }

  const updateAttribute = (variantIndex: number, attributeIndex: number, patch: Partial<AttributeRow>) => {
    updateVariant(variantIndex, {
      attributes: variants[variantIndex].attributes.map((attribute, i) =>
        i === attributeIndex ? { ...attribute, ...patch } : attribute
      ),
    })
  }

  const handleSubmit = () => {
    for (let i = 0; i < variants.length; i += 1) {
      const duplicateKey = findDuplicateAttribute(variants[i].attributes)
      if (duplicateKey) {
        setFormError(
          `Вариант ${i + 1}: атрибут «${attributeKeyLabel(duplicateKey)}» добавлен дважды. ` +
            'Разные значения (объёмы, цвета) — это отдельные варианты: нажмите «Добавить вариант».'
        )
        return
      }
    }
    setFormError(null)

    const variantPayloads: VariantPayload[] = variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      priceOverride: Number(variant.priceOverride),
      stockQuantity: Number(variant.stockQuantity),
      active: variant.active,
      imageUrls: variant.imageUrls,
      status: variant.status,
      attributes: Object.fromEntries(
        variant.attributes.filter((attribute) => attribute.key.trim() !== '').map((attribute) => [attribute.key, attribute.value])
      ),
    }))

    const payload: ProductPayload = {
      id: product?.id,
      name,
      description: description.trim() === '' ? null : description,
      category: category.trim() === '' ? null : category,
      active,
      colorSwatches: Object.fromEntries(
        Object.entries(colorSwatches).filter(([color]) => colorValues.includes(color))
      ),
      variants: variantPayloads,
    }

    onSubmit(payload)
  }

  const hasPricedVariant = variants.length > 0 && variants.every(
    (variant) => variant.priceOverride.trim() !== '' && !Number.isNaN(Number(variant.priceOverride))
  )

  const canSubmit =
    name.trim() !== '' && hasPricedVariant && uploadingVariantIndex === null && !swatchUploading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-4 border-black bg-white shadow-[8px_8px_0_0_#000]">
        <div className="flex items-center justify-between border-b-2 border-black px-6 py-4">
          <h2 className="font-grotesk text-lg font-bold text-ink">
            {product ? 'Редактировать товар' : 'Новый товар'}
          </h2>
          <button type="button" onClick={onClose} className="font-grotesk text-sm font-bold text-ink/50 hover:text-ink">
            Закрыть
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Название"
              className="rounded-pill border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Описание"
              className="rounded-3xl border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
            />
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Категория"
              className="rounded-pill border-2 border-black px-4 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              Активен
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-grotesk text-base font-bold text-ink">Варианты</h3>
            <button
              type="button"
              onClick={addVariant}
              className="rounded-pill border-2 border-black bg-silver px-3 py-1 font-grotesk text-xs font-bold text-ink hover:bg-bubblegum hover:text-white"
            >
              Добавить вариант
            </button>
          </div>
          {variants.length === 0 && (
            <p className="mt-2 text-xs text-red-500">Добавьте хотя бы один вариант — цена и фото задаются только на уровне варианта.</p>
          )}
          {variantUploadError && <p className="mt-2 text-xs text-red-500">{variantUploadError}</p>}
          {formError && <p className="mt-2 text-xs text-red-500">{formError}</p>}

          {variants.map((variant, variantIndex) => (
            <div key={variantIndex} className="mt-4 rounded-2xl border-2 border-black p-4">
              <div className="flex items-center justify-between">
                <span className="font-grotesk text-sm font-bold text-ink">Вариант {variantIndex + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVariant(variantIndex)}
                  className="font-grotesk text-xs font-bold text-ink/40 hover:text-bubblegum-dark"
                >
                  Удалить вариант
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(event) => updateVariant(variantIndex, { sku: event.target.value })}
                  placeholder="Артикул / SKU (необязательно)"
                  className="rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                />
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    value={variant.priceOverride}
                    onChange={(event) => updateVariant(variantIndex, { priceOverride: event.target.value })}
                    placeholder="Закупочная цена"
                    className="w-full rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                  />
                  {variant.priceOverride.trim() !== '' && !Number.isNaN(Number(variant.priceOverride)) && (
                    <p className="px-3 text-xs text-ink/50">
                      Клиенту: {formatPrice(previewDisplayPrice(Number(variant.priceOverride)))}
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  value={variant.stockQuantity}
                  onChange={(event) => updateVariant(variantIndex, { stockQuantity: event.target.value })}
                  placeholder="Остаток"
                  disabled={variant.status === 'PRE_ORDER'}
                  className="rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
                />
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={variant.active}
                    onChange={(event) => updateVariant(variantIndex, { active: event.target.checked })}
                  />
                  Активен
                </label>
                <div className="col-span-2 flex overflow-hidden rounded-pill border-2 border-black">
                  {STATUS_TOGGLE.map((option, optionIndex) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={variant.status === option.value}
                      onClick={() => setVariantStatus(variantIndex, option.value)}
                      className={`flex-1 px-3 py-2 font-grotesk text-sm font-bold transition ${
                        optionIndex > 0 ? 'border-l-2 border-black' : ''
                      } ${variant.status === option.value ? 'bg-bubblegum text-ink' : 'bg-white text-ink/50'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {variant.status === 'SOLD_OUT' && (
                  <p className="col-span-2 text-xs text-ink/50">
                    Солдаут скрывает вариант из каталога. Если все варианты в солдауте — товар уходит в архив.
                  </p>
                )}
              </div>

              <div className="mt-3">
                <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">
                  Фото варианта ({variant.imageUrls.length})
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {variant.imageUrls.map((url, imageIndex) => (
                    <div key={url + imageIndex} className="relative">
                      <img
                        src={url}
                        alt={`Фото ${imageIndex + 1} варианта ${variantIndex + 1}`}
                        className="h-16 w-16 rounded-2xl border-2 border-black object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateVariant(variantIndex, {
                            imageUrls: variant.imageUrls.filter((_, i) => i !== imageIndex),
                          })
                        }
                        aria-label={`Удалить фото ${imageIndex + 1}`}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-white font-grotesk text-xs font-bold text-ink transition hover:bg-black hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    id={`${imageUploadId}-variant-${variantIndex}`}
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleVariantImageSelected(variantIndex, event)}
                    disabled={uploadingVariantIndex !== null}
                    className="hidden"
                  />
                  <label
                    htmlFor={`${imageUploadId}-variant-${variantIndex}`}
                    className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-black bg-silver font-grotesk text-xs font-bold text-ink transition hover:bg-bubblegum hover:text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                    aria-disabled={uploadingVariantIndex !== null}
                  >
                    {uploadingVariantIndex === variantIndex ? '...' : '+'}
                  </label>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-grotesk text-xs font-bold uppercase tracking-wide text-ink/50">Атрибуты</span>
                  <button
                    type="button"
                    onClick={() => addAttribute(variantIndex)}
                    className="font-grotesk text-xs font-bold text-bubblegum-dark hover:underline"
                  >
                    Добавить атрибут
                  </button>
                </div>

                {variant.attributes.map((attribute, attributeIndex) => {
                  const valueOptions = (ATTRIBUTE_VALUE_OPTIONS[attribute.key] ?? []).map((value) => ({
                    label: value,
                    value,
                  }))
                  return (
                    <div key={attributeIndex} className="mt-2 flex items-center gap-2">
                      <div className="w-1/2">
                        {attribute.customKey ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={attribute.key}
                              onChange={(event) =>
                                updateAttribute(variantIndex, attributeIndex, { key: event.target.value })
                              }
                              placeholder="Название атрибута"
                              className="w-full rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateAttribute(variantIndex, attributeIndex, {
                                  customKey: false,
                                  key: '',
                                  value: '',
                                })
                              }
                              className="shrink-0 font-grotesk text-xs font-bold text-ink/40 hover:text-bubblegum-dark"
                            >
                              Список
                            </button>
                          </div>
                        ) : (
                          <OptionDropdown
                            options={ATTRIBUTE_KEY_OPTIONS}
                            value={attribute.key}
                            onChange={(key) =>
                              key === CUSTOM_ATTRIBUTE_KEY
                                ? updateAttribute(variantIndex, attributeIndex, {
                                    customKey: true,
                                    key: '',
                                    value: '',
                                  })
                                : updateAttribute(variantIndex, attributeIndex, { key, value: '' })
                            }
                            placeholder="Атрибут"
                          />
                        )}
                      </div>
                      <div className="w-1/2">
                        {attribute.customKey ? (
                          <input
                            type="text"
                            value={attribute.value}
                            onChange={(event) =>
                              updateAttribute(variantIndex, attributeIndex, { value: event.target.value })
                            }
                            placeholder="Значение"
                            className="w-full rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                          />
                        ) : attribute.key === VOLUME_ATTRIBUTE_KEY ? (
                          <input
                            type="number"
                            value={attribute.value}
                            onChange={(event) =>
                              updateAttribute(variantIndex, attributeIndex, { value: event.target.value })
                            }
                            placeholder="Объём, мл"
                            className="w-full rounded-pill border-2 border-black px-3 py-2 font-grotesk text-base font-semibold sm:text-sm text-ink outline-none focus:border-bubblegum-dark"
                          />
                        ) : (
                          <OptionDropdown
                            options={valueOptions}
                            value={attribute.value}
                            onChange={(value) => updateAttribute(variantIndex, attributeIndex, { value })}
                            placeholder={attribute.key ? 'Значение' : 'Сначала выберите атрибут'}
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttribute(variantIndex, attributeIndex)}
                        className="shrink-0 font-grotesk text-xs font-bold text-ink/40 hover:text-bubblegum-dark"
                      >
                        Удалить
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {colorValues.length > 0 && (
            <div className="mt-6">
              <h3 className="font-grotesk text-base font-bold text-ink">Кружки цвета</h3>
              <p className="mt-1 text-xs text-ink/50">
                Отдельное круглое фото для каждого цвета — показывается в каталоге и на странице товара.
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                {colorValues.map((color) => (
                  <div key={color} className="flex w-20 flex-col items-center gap-1">
                    <label
                      className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-black bg-silver transition hover:border-bubblegum-dark aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                      aria-disabled={swatchUploading}
                    >
                      {colorSwatches[color] ? (
                        <img src={colorSwatches[color]} alt={color} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-grotesk text-xl font-bold text-ink/30">+</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        aria-label={`Фото цвета ${color}`}
                        disabled={swatchUploading}
                        onChange={(event) => handleSwatchFileSelected(color, event)}
                        className="hidden"
                      />
                    </label>
                    <span className="truncate text-center font-grotesk text-xs font-bold text-ink" title={color}>
                      {color}
                    </span>
                    {colorSwatches[color] && (
                      <button
                        type="button"
                        onClick={() =>
                          setColorSwatches((current) => {
                            const next = { ...current }
                            delete next[color]
                            return next
                          })
                        }
                        className="font-grotesk text-xs font-bold text-ink/40 hover:text-bubblegum-dark"
                      >
                        Убрать
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {cropper && (
          <CircleCropper
            file={cropper.file}
            title={`Кружок цвета: ${cropper.color}`}
            busy={swatchUploading}
            onCancel={() => setCropper(null)}
            onConfirm={handleCropperConfirm}
          />
        )}

        <div className="border-t-2 border-black px-6 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-pill border-2 border-black bg-ink px-4 py-3 font-grotesk text-sm font-bold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
