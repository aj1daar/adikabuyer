import { useState, type ChangeEvent } from 'react'
import type { ProductDto } from '../../types/catalog'
import type { ProductPayload, VariantPayload } from '../../types/admin'
import uploadMedia from '../../api/media'

type AttributeRow = {
  key: string
  value: string
}

type VariantDraft = {
  id?: number
  sku: string
  priceOverride: string
  stockQuantity: string
  active: boolean
  attributes: AttributeRow[]
}

type ProductFormProps = {
  product?: ProductDto
  onSubmit: (payload: ProductPayload) => void
  onClose: () => void
  isSubmitting?: boolean
}

function toAttributeRows(attributes: Record<string, unknown>): AttributeRow[] {
  return Object.entries(attributes).map(([key, value]) => ({ key, value: String(value) }))
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
    attributes: toAttributeRows(variant.attributes),
  }))
}

export default function ProductForm({ product, onSubmit, onClose, isSubmitting }: ProductFormProps) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [basePrice, setBasePrice] = useState(product?.basePrice.toString() ?? '')
  const [active, setActive] = useState(product?.active ?? true)
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl ?? null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [variants, setVariants] = useState<VariantDraft[]>(toVariantDraft(product))

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsUploadingImage(true)
    setImageUploadError(null)

    try {
      const response = await uploadMedia(file)
      setImageUrl(response.url)
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : 'Не удалось загрузить изображение.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const addVariant = () => {
    setVariants([
      ...variants,
      { sku: '', priceOverride: '', stockQuantity: '0', active: true, attributes: [] },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, patch: Partial<VariantDraft>) => {
    setVariants(variants.map((variant, i) => (i === index ? { ...variant, ...patch } : variant)))
  }

  const addAttribute = (variantIndex: number) => {
    updateVariant(variantIndex, {
      attributes: [...variants[variantIndex].attributes, { key: '', value: '' }],
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
    const variantPayloads: VariantPayload[] = variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      priceOverride: variant.priceOverride.trim() === '' ? null : Number(variant.priceOverride),
      stockQuantity: Number(variant.stockQuantity),
      active: variant.active,
      attributes: Object.fromEntries(
        variant.attributes.filter((attribute) => attribute.key.trim() !== '').map((attribute) => [attribute.key, attribute.value])
      ),
    }))

    const payload: ProductPayload = {
      id: product?.id,
      name,
      description: description.trim() === '' ? null : description,
      category: category.trim() === '' ? null : category,
      basePrice: Number(basePrice),
      active,
      imageUrl,
      variants: variantPayloads,
    }

    onSubmit(payload)
  }

  const canSubmit = name.trim() !== '' && basePrice.trim() !== '' && !isUploadingImage

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
          <h2 className="font-grotesk text-lg font-semibold text-ink">
            {product ? 'Редактировать товар' : 'Новый товар'}
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-ink/50 hover:text-ink">
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
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Описание"
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
            />
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Категория"
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
            />
            <input
              type="number"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              placeholder="Базовая цена"
              className="rounded-xl border border-ink/15 px-4 py-2 text-sm text-ink outline-none focus:border-bubblegum"
            />
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              Активен
            </label>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-ink/50">
                Изображение
              </label>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Предпросмотр изображения товара"
                  className="h-24 w-24 rounded-xl border border-ink/10 object-cover"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelected}
                className="text-sm text-ink"
              />
              {isUploadingImage && <p className="text-xs text-ink/50">Загружаем изображение...</p>}
              {imageUploadError && <p className="text-xs text-red-500">{imageUploadError}</p>}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-grotesk text-base font-semibold text-ink">Варианты</h3>
            <button
              type="button"
              onClick={addVariant}
              className="rounded-pill bg-silver px-3 py-1 text-xs font-medium text-ink hover:bg-silver-dark"
            >
              Добавить вариант
            </button>
          </div>

          {variants.map((variant, variantIndex) => (
            <div key={variantIndex} className="mt-4 rounded-2xl border border-ink/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Вариант {variantIndex + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVariant(variantIndex)}
                  className="text-xs text-ink/40 hover:text-bubblegum-dark"
                >
                  Удалить вариант
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(event) => updateVariant(variantIndex, { sku: event.target.value })}
                  placeholder="SKU"
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                />
                <input
                  type="number"
                  value={variant.priceOverride}
                  onChange={(event) => updateVariant(variantIndex, { priceOverride: event.target.value })}
                  placeholder="Цена (переопределение)"
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                />
                <input
                  type="number"
                  value={variant.stockQuantity}
                  onChange={(event) => updateVariant(variantIndex, { stockQuantity: event.target.value })}
                  placeholder="Остаток"
                  className="rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                />
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={variant.active}
                    onChange={(event) => updateVariant(variantIndex, { active: event.target.checked })}
                  />
                  Активен
                </label>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-ink/50">Атрибуты</span>
                  <button
                    type="button"
                    onClick={() => addAttribute(variantIndex)}
                    className="text-xs text-bubblegum-dark hover:underline"
                  >
                    Добавить атрибут
                  </button>
                </div>

                {variant.attributes.map((attribute, attributeIndex) => (
                  <div key={attributeIndex} className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={attribute.key}
                      onChange={(event) =>
                        updateAttribute(variantIndex, attributeIndex, { key: event.target.value })
                      }
                      placeholder="Ключ"
                      className="w-1/2 rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                    />
                    <input
                      type="text"
                      value={attribute.value}
                      onChange={(event) =>
                        updateAttribute(variantIndex, attributeIndex, { value: event.target.value })
                      }
                      placeholder="Значение"
                      className="w-1/2 rounded-xl border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-bubblegum"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(variantIndex, attributeIndex)}
                      className="text-xs text-ink/40 hover:text-bubblegum-dark"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-ink/10 px-6 py-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-pill bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-bubblegum-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Сохраняем...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
