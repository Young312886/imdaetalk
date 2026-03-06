import { ReactNode } from 'react'

interface BentoBoxProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function BentoBox({ children, className = '', noPadding = false }: BentoBoxProps) {
  return (
    <div className={`bento-box ${noPadding ? '' : 'p-5'} ${className}`}>
      {children}
    </div>
  )
}
