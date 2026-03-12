import { Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  className?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  className = '',
  type = 'default',
  ...rest
}: ThemedTextProps) {
  let typeClass = '';
  
  switch (type) {
    case 'title':
      typeClass = 'text-4xl font-bold text-text leading-10';
      break;
    case 'subtitle':
      typeClass = 'text-xl font-bold text-text';
      break;
    case 'defaultSemiBold':
      typeClass = 'text-base font-semibold text-text';
      break;
    case 'link':
      typeClass = 'text-base text-primary underline';
      break;
    default:
      typeClass = 'text-base text-text';
  }

  return (
    <Text className={`${typeClass} ${className}`} {...rest} />
  );
}

