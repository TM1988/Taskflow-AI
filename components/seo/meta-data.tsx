// components/seo/meta-data.tsx
import Head from "next/head";

interface MetaDataProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
}

export default function MetaData({
  title,
  description,
  canonicalUrl,
  ogImage = "/og-image.png",
}: MetaDataProps) {
  const siteTitle = `${title} | TaskFlow AI`;

  return (
    <Head>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* OpenGraph */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
