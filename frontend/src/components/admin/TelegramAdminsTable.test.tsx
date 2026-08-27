import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TelegramAdminsTable from './TelegramAdminsTable'
import type { TelegramAdminDto } from '../../types/telegramAdmin'

const admin: TelegramAdminDto = {
  chatId: 42,
  username: 'shop_owner',
  registeredAt: '2026-01-01T00:00:00Z',
}

describe('TelegramAdminsTable', () => {
  it('shows a loading message on first load', () => {
    render(<TelegramAdminsTable admins={[]} loading error={null} />)

    expect(screen.getByText('Загрузка подписчиков...')).toBeInTheDocument()
  })

  it('shows an error message', () => {
    render(<TelegramAdminsTable admins={[]} loading={false} error="Network error" />)

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('shows an empty state when no one is subscribed', () => {
    render(<TelegramAdminsTable admins={[]} loading={false} error={null} />)

    expect(screen.getByText('Пока никто не подписался.')).toBeInTheDocument()
  })

  it('renders admin details', () => {
    render(<TelegramAdminsTable admins={[admin]} loading={false} error={null} />)

    expect(screen.getByText('shop_owner')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('falls back to a dash when username is missing', () => {
    render(<TelegramAdminsTable admins={[{ ...admin, username: null }]} loading={false} error={null} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
