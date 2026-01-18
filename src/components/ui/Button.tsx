import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles = {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    border: '1px solid transparent',
    transition: 'background-color 0.2s, border-color 0.2s',
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#0070f3',
      color: 'white',
      borderColor: '#0070f3',
    },
    secondary: {
      backgroundColor: '#f5f5f5',
      color: '#333',
      borderColor: '#ddd',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#0070f3',
      borderColor: '#0070f3',
    },
  };

  return (
    <button
      type={type}
      style={{ ...baseStyles, ...variantStyles[variant] }}
      {...props}
    >
      {children}
    </button>
  );
}
