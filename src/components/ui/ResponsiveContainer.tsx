/**
 * Responsive container component with theme-aware breakpoints and spacing
 */

import type { ReactNode } from 'react'


interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  center?: boolean
}

export function ResponsiveContainer({ 
  children, 
  className = '', 
  maxWidth = 'xl',
  padding = 'md',
  center = true
}: ResponsiveContainerProps) {

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm'
      case 'md': return 'max-w-md'
      case 'lg': return 'max-w-lg'
      case 'xl': return 'max-w-xl'
      case '2xl': return 'max-w-2xl'
      case 'full': return 'max-w-full'
      default: return 'max-w-xl'
    }
  }

  const getPaddingClass = () => {
    switch (padding) {
      case 'none': return ''
      case 'sm': return 'px-2 py-2 sm:px-4 sm:py-4'
      case 'md': return 'px-4 py-4 sm:px-6 sm:py-6'
      case 'lg': return 'px-6 py-6 sm:px-8 sm:py-8'
      case 'xl': return 'px-8 py-8 sm:px-12 sm:py-12'
      default: return 'px-4 py-4 sm:px-6 sm:py-6'
    }
  }

  return (
    <div 
      className={`
        w-full 
        ${getMaxWidthClass()} 
        ${center ? 'mx-auto' : ''} 
        ${getPaddingClass()} 
        ${className}
      `}
      style={{
        minHeight: 'calc(100vh - 4rem)' // Account for header
      }}
    >
      {children}
    </div>
  )
}

/**
 * Responsive grid component
 */
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    default: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

export function ResponsiveGrid({ 
  children, 
  className = '', 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const getGridClass = () => {
    const { default: defaultCols, sm, md, lg, xl } = cols
    let gridClass = `grid-cols-${defaultCols}`
    
    if (sm) gridClass += ` sm:grid-cols-${sm}`
    if (md) gridClass += ` md:grid-cols-${md}`
    if (lg) gridClass += ` lg:grid-cols-${lg}`
    if (xl) gridClass += ` xl:grid-cols-${xl}`
    
    return gridClass
  }

  const getGapClass = () => {
    switch (gap) {
      case 'sm': return 'gap-2'
      case 'md': return 'gap-4'
      case 'lg': return 'gap-6'
      case 'xl': return 'gap-8'
      default: return 'gap-4'
    }
  }

  return (
    <div className={`grid ${getGridClass()} ${getGapClass()} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Responsive stack component for vertical layouts
 */
interface ResponsiveStackProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  align?: 'start' | 'center' | 'end' | 'stretch'
}

export function ResponsiveStack({ 
  children, 
  className = '', 
  spacing = 'md',
  align = 'stretch'
}: ResponsiveStackProps) {
  const getSpacingClass = () => {
    switch (spacing) {
      case 'sm': return 'space-y-2'
      case 'md': return 'space-y-4'
      case 'lg': return 'space-y-6'
      case 'xl': return 'space-y-8'
      default: return 'space-y-4'
    }
  }

  const getAlignClass = () => {
    switch (align) {
      case 'start': return 'items-start'
      case 'center': return 'items-center'
      case 'end': return 'items-end'
      case 'stretch': return 'items-stretch'
      default: return 'items-stretch'
    }
  }

  return (
    <div className={`flex flex-col ${getSpacingClass()} ${getAlignClass()} ${className}`}>
      {children}
    </div>
  )
}

/**
 * Responsive breakpoint hook for conditional rendering
 */
import { useState, useEffect } from 'react'

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('sm')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else setBreakpoint('sm')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2xl: breakpoint === '2xl',
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint)
  }
}

/**
 * Mobile-first responsive text component
 */
interface ResponsiveTextProps {
  children: ReactNode
  className?: string
  size?: {
    default: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  }
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
}

export function ResponsiveText({ 
  children, 
  className = '', 
  size = { default: 'base' },
  weight = 'normal'
}: ResponsiveTextProps) {
  const getSizeClass = () => {
    const { default: defaultSize, sm, md, lg } = size
    let sizeClass = `text-${defaultSize}`
    
    if (sm) sizeClass += ` sm:text-${sm}`
    if (md) sizeClass += ` md:text-${md}`
    if (lg) sizeClass += ` lg:text-${lg}`
    
    return sizeClass
  }

  const getWeightClass = () => {
    switch (weight) {
      case 'light': return 'font-light'
      case 'normal': return 'font-normal'
      case 'medium': return 'font-medium'
      case 'semibold': return 'font-semibold'
      case 'bold': return 'font-bold'
      default: return 'font-normal'
    }
  }

  return (
    <span className={`${getSizeClass()} ${getWeightClass()} ${className}`}>
      {children}
    </span>
  )
}