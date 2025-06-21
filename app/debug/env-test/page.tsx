"use client";

export default function EnvTestPage() {
  const envVars = {
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    NEXT_PUBLIC_ORG_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_ORG_GITHUB_CLIENT_ID,
    NEXT_PUBLIC_GITHUB_APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID,
    NEXT_PUBLIC_ORG_GITHUB_APP_ID: process.env.NEXT_PUBLIC_ORG_GITHUB_APP_ID,
    NODE_ENV: process.env.NODE_ENV
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
}
