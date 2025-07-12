This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## LocalStorage in Windows

`%LOCALAPPDATA%\<IDENTIFIER>\EBWebView\Default`

## Microsoft Store

An unsigned package must include a special OID (organization ID) value in its Identity element in the manifest file, otherwise it won't be allowed to register. An unsigned package will never have the same identity as a package that's signed. That prevents unsigned packages from conflicting with, or spoofing the identity of, a signed package.

```xml
<Identity Name="NumberGuesserManifest"
  Publisher="CN=AppModelSamples, OID.2.25.311729368913984317654407730594956997722=1"
  Version="1.0.0.0" />
```

<https://learn.microsoft.com/en-us/windows/msix/package/unsigned-package>

Install

```powershell
Add-MsixPackage -Path .\minesweeperh5_unsigned.msix -AllowUnsigned
```
