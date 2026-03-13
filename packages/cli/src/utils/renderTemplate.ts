
import Handlebars from "handlebars"

export interface ChangelogTemplateData {
  versions: string[]
  features: string[]
  fixes: string[]
  chores: string[]
}

export const changelogTemplate = `
# Changelog release notes

## Updated packages

{{#each versions}}
- {{{this}}}
{{/each}}

{{#if features}}
### ✨ Features
{{#each features}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if fixes}}
### 🐛 Fixes
{{#each fixes}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if chores}}
### 🧹 Chores
{{#each chores}}
- {{{this}}}
{{/each}}
{{/if}}

`

export function renderTemplate(data: ChangelogTemplateData) {
  const compile = Handlebars.compile(changelogTemplate)
  return compile(data)
}
