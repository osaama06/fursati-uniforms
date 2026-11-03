'use client';

import { useRouter } from 'next/navigation';

export default function ReusableButton({
  goToCheckout = false,
  onClick,
  children,
  bgColor = '#f0c14b',
  textColor = '#000',
  border = '1px solid #a88734',
  padding = '12px 20px',
  fontSize = '16px',
  radius = '6px',
  fullWidth = false,
  style = {},
}) {
  const router = useRouter();

  const handleClick = () => {
    if (goToCheckout) {
    //   router.push('/checkout');
    router.replace('/checkout');
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: border,
        borderRadius: radius,
        padding: padding,
        fontSize: fontSize,
        fontWeight: 'bold',
        cursor: 'pointer',
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
