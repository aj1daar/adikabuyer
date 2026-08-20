export type AttributeOption = {
  label: string
  value: string
}

export const ATTRIBUTE_KEY_OPTIONS: AttributeOption[] = [
  { label: 'Цвет', value: 'color' },
  { label: 'Размер', value: 'size' },
  { label: 'Объём', value: 'volume' },
]

export const ATTRIBUTE_VALUE_OPTIONS: Record<string, string[]> = {
  color: ['Чёрный', 'Белый', 'Розовый', 'Серебристый'],
  size: ['S', 'M', 'L'],
  volume: ['350 мл', '500 мл', '750 мл'],
}
