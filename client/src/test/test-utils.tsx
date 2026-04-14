import React from 'react'
import { render as rtlRender, RenderOptions } from '@testing-library/react'
import { ToasterProvider } from '../components/ToasterProvider'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom render options here if needed
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(ToasterProvider, { children })
}

function render(ui: React.ReactElement, options?: CustomRenderOptions) {
  return rtlRender(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'
export { render }
