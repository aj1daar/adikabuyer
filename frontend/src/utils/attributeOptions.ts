export type AttributeOption = {
  label: string
  value: string
}

export const VOLUME_ATTRIBUTE_KEY = 'volume'

export const CUSTOM_ATTRIBUTE_KEY = '__custom__'

export const ATTRIBUTE_KEY_OPTIONS: AttributeOption[] = [
  { label: 'Цвет', value: 'color' },
  { label: 'Размер', value: 'size' },
  { label: 'Объём', value: VOLUME_ATTRIBUTE_KEY },
  { label: '+ Другой атрибут', value: CUSTOM_ATTRIBUTE_KEY },
]

export const ATTRIBUTE_VALUE_OPTIONS: Record<string, string[]> = {
  color: ['Чёрный', 'Белый', 'Розовый', 'Серебристый', 'Леопардовый'],
  size: ['S', 'M', 'L'],
}

export function formatAttributeValue(key: string, value: unknown): string {
  return key === VOLUME_ATTRIBUTE_KEY ? `${value} мл` : String(value)
}
