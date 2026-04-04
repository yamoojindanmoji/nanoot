'use client';

import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'cta';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    
    let variantStyles = "bg-gray-900 text-gray-50 hover:bg-gray-900/90"
    if (variant === 'secondary') variantStyles = "bg-gray-100 text-gray-900 hover:bg-gray-100/80"
    if (variant === 'outline') variantStyles = "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 text-gray-900"
    if (variant === 'ghost') variantStyles = "hover:bg-gray-100 hover:text-gray-900"
    if (variant === 'cta') variantStyles = "bg-[#C1EB3B] text-gray-900 hover:bg-[#A3CE2A] w-full h-14 text-[16px] font-bold rounded-xl"

    let sizeStyles = "h-12 px-4 py-2"
    if (size === 'sm') sizeStyles = "h-9 px-3"
    if (size === 'lg') sizeStyles = "h-14 px-8 text-lg"
    if (size === 'icon') sizeStyles = "h-10 w-10"

    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles} ${sizeStyles} ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
