import React from 'react'
import { Toaster } from 'sonner'

export const ToasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Toaster
        position="top-right"
        richColors
        theme="light"
        closeButton
        expand
        visibleToasts={5}
      />
      {children}
    </>
  )
}
