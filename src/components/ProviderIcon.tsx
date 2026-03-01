import { PROVIDER_ICONS } from '../data/providerIcons';

interface ProviderIconProps {
  provider: string;
  size?: number;
  color?: string;
  className?: string;
}

const ProviderIcon = ({
  provider,
  size = 16,
  color = 'currentColor',
  className,
}: ProviderIconProps) => {
  const iconData = PROVIDER_ICONS[provider];

  if (!iconData) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full text-white font-bold shrink-0 ${className ?? ''}`}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.5,
          background: color !== 'currentColor' ? color : '#888',
        }}
      >
        {provider.charAt(0)}
      </span>
    );
  }

  return (
    <svg
      viewBox={iconData.viewBox ?? '0 0 24 24'}
      width={size}
      height={size}
      fill={color}
      className={`shrink-0 ${className ?? ''}`}
    >
      {iconData.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
};

export default ProviderIcon;
