import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { getMDXComponents } from '../../../mdx-components'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

type PageProps = {
  params: Promise<{
    mdxPath?: string[]
  }>
}

// Get MDX components at module level
const mdxComponents = getMDXComponents()
const Wrapper = mdxComponents.wrapper as React.ComponentType<{
  toc: unknown
  metadata: unknown
  children: React.ReactNode
}>

export default async function Page(props: PageProps) {
  const params = await props.params
  const result = await importPage(params.mdxPath)
  const { default: MDXContent, toc, metadata } = result

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  )
}
