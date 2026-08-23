import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Since we have a root `[locale]` layout, this layout simply renders its children.
export default function RootLayout({ children }: Props) {
  return children;
}
