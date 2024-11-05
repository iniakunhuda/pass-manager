// .eslintrc.js or eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        React: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { 
      react: { 
        version: '18.3',
        // Add this to help ESLint detect components
        createClass: 'createReactClass',
        pragma: 'React',
        fragment: 'Fragment',
      },
      // Add prop types settings
      propWrapperFunctions: [
        'forbidExtraProps',
        { property: 'freeze', object: 'Object' },
      ],
      componentWrapperFunctions: [
        'observer',
        { property: 'styled' },
        { property: 'forwardRef' },
      ],
      formComponents: ['CustomForm', { name: 'Form', formAttribute: 'endpoint' }],
      linkComponents: ['Hyperlink', { name: 'Link', linkAttribute: 'to' }],
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      
      // Disable prop-types validation
      'react/prop-types': 'off',
      
      // Additional helpful rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-target-blank': 'off',
      'react/display-name': 'off',
      'react/jsx-key': 'warn',
      'react/jsx-no-duplicate-props': 'warn',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/no-unknown-property': 'warn',
      'react/no-unused-state': 'warn',
      
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]