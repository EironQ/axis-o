import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variants = {
  primary: 'bg-[#3C2415] text-[#FAF7F2] border-[#3C2415] hover:bg-[#5C3A2A] hover:border-[#5C3A2A] disabled:bg-[#9C8B7A] disabled:border-[#9C8B7A] disabled:cursor-not-allowed',
  outline: 'bg-transparent text-[#3C2415] border-[#3C2415] hover:bg-[#3C2415] hover:text-[#FAF7F2] disabled:opacity-40 disabled:cursor-not-allowed',
  ghost: 'bg-transparent text-[#3C2415] border-transparent hover:bg-[#3C2415]/5 disabled:opacity-40 disabled:cursor-not-allowed',
  danger: 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600 disabled:opacity-40 disabled:cursor-not-allowed',
}

const sizes = {
  sm: 'px-5 py-2 text-sm',
  md: 'px-8 py-3 text-base',
  lg: 'px-12 py-4 text-lg',
}

export default function Button({
  variant = 'outline',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center border font-medium tracking-wide transition-all duration-300 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
