import { useMDXComponents as getDocsMDXComponents } from 'nextra-theme-docs'

// Export as regular function for use in server components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMDXComponents(components: any = {}): any {
  const docsComponents = getDocsMDXComponents(components)
  return {
    ...docsComponents,
    ...components,
  }
}

// Keep hook version for Next.js MDX integration
export const useMDXComponents = getMDXComponents
