import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: 'MiniVault Documentation',
  description: 'Documentation for MiniVault project management dashboard',
}

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pageMap = await getPageMap('/docs')

  return (
    <Layout
      navbar={
        <Navbar
          logo={<span className="font-bold">MiniVault Docs</span>}
        />
      }
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/yasser-ensembl3/Tao-promotion"
      footer={<Footer>MIT {new Date().getFullYear()} © MiniVault</Footer>}
    >
      <Head />
      {children}
    </Layout>
  )
}
