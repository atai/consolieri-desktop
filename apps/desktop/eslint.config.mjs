import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

const silentCatchSelectors = [
  {
    selector: 'CatchClause > BlockStatement[body.length=0]',
    message:
      'Do not swallow errors with an empty catch (comments do not count). Log, rethrow, apply an explicit fallback, or call reportBestEffortFailure().'
  },
  {
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.property.name="catch"] > ArrowFunctionExpression[expression=false] > BlockStatement[body.length=0]',
    message:
      'Do not use empty .catch(() => {}). Log, rethrow, return an explicit fallback, or call reportBestEffortFailure().'
  },
  {
    selector:
      'CallExpression[callee.type="MemberExpression"][callee.property.name="catch"] > FunctionExpression > BlockStatement[body.length=0]',
    message:
      'Do not use empty .catch(function () {}). Log, rethrow, return an explicit fallback, or call reportBestEffortFailure().'
  }
]

const hexClassSelectors = [
  {
    selector:
      'Literal[value=/^(?:.*?)(?:bg|text|border|ring|from|to|via|fill|stroke)-\\[[#][0-9a-fA-F]{3,8}\\]/]',
    message:
      'Use design-system semantic utilities (bg-bg, border-border, text-muted, …) or theme/hex.ts for non-Tailwind colors — not arbitrary hex in className.'
  },
  {
    selector: 'TemplateElement[value.raw=/\\b(?:bg|text|border)-\\[[#][0-9a-fA-F]{3,8}\\]/]',
    message:
      'Use design-system semantic utilities (bg-bg, border-border, text-muted, …) — not arbitrary hex in className templates.'
  }
]

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      // Intentional unused names: interface stubs (`_data`) and rest-omit (`{ cols, ...rest }`).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      'no-restricted-syntax': ['error', ...silentCatchSelectors]
    }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...silentCatchSelectors, ...hexClassSelectors]
    }
  },
  {
    files: [
      'src/renderer/src/theme/hex.ts',
      'src/renderer/src/components/map/**/*.{ts,tsx}',
      'src/renderer/src/terminal/**/*.{ts,tsx}',
      'src/renderer/src/components/vnc/**/*.{ts,tsx}',
      'src/renderer/src/components/rdp/**/*.{ts,tsx}'
    ],
    rules: {
      // Keep silent-catch rule; only drop hex class restrictions for these files.
      'no-restricted-syntax': ['error', ...silentCatchSelectors]
    }
  },
  eslintConfigPrettier
)
