import React from 'react'
import { cn } from '../../utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-gray-800 border border-gray-700 rounded-lg', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('p-6 pb-0', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn('text-lg font-semibold text-white', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-gray-400', className)}
      {...props}
    >
      {children}
    </p>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  )
}