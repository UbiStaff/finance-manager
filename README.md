# Personal Finance Manager

中文 | English
- 中文说明请查看 `README_CN.md`
- For English README, see below

## Overview
Personal finance web app with income/expense records, category/account management, charts, and import/export.

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js (Express) + Prisma ORM
- Database: SQL Server (Azure SQL Edge via Docker)
- Charts: Recharts

## Key Features
- Transactions: amount, type, date, note, category, account
- Stats & Charts: pie (by category), bar (monthly income vs expense)
- Import: Alipay CSV (GBK/UTF-8), WeChat XLSX; auto-match categories/accounts
- Export: Excel/CSV (extensible)
- Manage: create/delete categories and accounts in UI
- Privacy masking: bank card names masked like "CCB Saving Card（1234）" or "Card ****1234"

## Quick Start
- One-click start: `./start.sh`
  - Starts DB container → sync Prisma → run dev servers
  - Frontend: `http://localhost:5173`, Backend: `http://localhost:3001`

## Import Guide
- Use "Import Excel/CSV" on the Home page
- Alipay CSV: encoding detection, header parsing, skip failed/neutral entries
- WeChat XLSX: header mapping to system fields
- Auto-create missing categories/accounts; masking applied
- Duplicate prevention by time/amount/account/note

## Scripts
- Reset transactions and seed: `npx tsx scripts/reset_transactions.ts`
- Mask accounts: `npx tsx scripts/mask_accounts.ts`
- Rename specific account: `npx tsx scripts/rename_account.ts`

## Changelog
- See `CHANGELOG.md` (current version v1.0.0)

For full Chinese documentation, open `README_CN.md`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```
