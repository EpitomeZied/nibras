import Image from 'next/image';

type LogoVariant = 'surface' | 'inverse' | 'theme';

const variantStyles: Record<LogoVariant, { filter?: string; opacity?: number }> = {
  surface: {},
  inverse: { filter: 'invert(1)' },
  theme: { filter: 'invert(1)' },
};

export default function NibrasLogoMark({
  variant = 'theme',
  width,
  className = '',
  priority = false,
}: {
  variant?: LogoVariant;
  width: number;
  className?: string;
  priority?: boolean;
}) {
  const height = Math.round(width * 0.42);
  const style = variantStyles[variant];

  return (
    <Image
      src="/icon.svg?v=2"
      alt="Nibras"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{
        display: 'block',
        width,
        height: 'auto',
        ...style,
      }}
    />
  );
}
