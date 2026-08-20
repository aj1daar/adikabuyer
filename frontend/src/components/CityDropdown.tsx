import OptionDropdown from './OptionDropdown'

type CityDropdownProps = {
  cities: readonly string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export default function CityDropdown({ cities, value, onChange, placeholder }: CityDropdownProps) {
  return (
    <OptionDropdown
      options={cities.map((city) => ({ label: city, value: city }))}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}
