# @stereobooster/remark-wiki-link

Fork of [remark-wiki-link](https://github.com/landakram/remark-wiki-link) to simplify options.

[![npm version](https://badge.fury.io/js/@stereobooster%2Fremark-wiki-link.svg)](https://badge.fury.io/js/@stereobooster%2Fremark-wiki-link)
[![Build Status](https://github.com/stereobooster/remark-wiki-link/actions/workflows/node.js.yml/badge.svg)](https://github.com/stereobooster/remark-wiki-link/actions/workflows/node.js.yml)

⚠️ This plugin is affected by the new parser in remark ([`micromark`](https://github.com/micromark/micromark), see [`remarkjs/remark#536`](https://github.com/remarkjs/remark/pull/536)). **For remark 12, use v0.0.x of this package**. **For remark 13+, use v1.0.0 or above.**

This [remark](https://github.com/wooorm/remark) plugin parses and renders `[[Wiki Links]]`.

* Parse wiki-style links and render them as anchors
* Parse aliased wiki links i.e `[[Real Page:Page Alias]]`

Looking for lower level packages? Check out [@stereobooster/mdast-util-wiki-link](https://github.com/stereobooster/mdast-util-wiki-link) for working with ASTs and [micromark-extension-wiki-link](https://github.com/landakram/micromark-extension-wiki-link) for working with tokens.

## Usage

```javascript
const unified = require('unified')
const markdown = require('remark-parse')
const wikiLinkPlugin = require('@stereobooster/remark-wiki-link');

let processor = unified()
    .use(markdown, { gfm: true })
    .use(wikiLinkPlugin)
```

When the processor is run, wiki links will be parsed to a `wikiLink` node. 

If we have this markdown string: 

```
[[Test Page]]
```

A node will be created that looks like this:

```javascript
{
    value: 'Test Page',
    data: {
        alias: 'Test Page',
        permalink: 'Test Page',
        hName: 'a',
        hProperties: {
            href: 'Test Page'
        },
        hChildren: [{
            type: 'text',
            value: 'Test Page'
        }]
    }
}
```

* `data.alias`: The display name for this link
* `data.permalink`: The permalink for this page. This permalink is computed from `node.value` using `options.linkResolver`, which can be passed in when initializing the plugin. 
* `data.h...`: provide compatibility with [`rehype`](https://github.com/rehypejs/rehype). Computed from `data` using `options.linkTemplate`

### Configuration options

* `options.linkResolver (pageName: String) -> String`: A function that maps a page name to a permalink. 
* `options.linkTemplate (opts: { permalink: string, alias: string }) -> hast`: A function that creates hast representation of wiki link. Default value is:

```ts
function defaultLinkTemplate ({ permalink, alias }: LinkTemplateProps) {
  return {
    hName: 'a',
    hProperties: { href: permalink },
    hChildren: [{ type: 'text', value: alias }]
  }
}
```

* `options.aliasDivider [String]`: a string to be used as the divider for aliases. See the section below on [Aliasing pages](#aliasing-pages). Defaults to `":"`.

### Aliasing pages

Aliased pages are supported with the following markdown syntax: 

```
[[Real Page:Page Alias]]
```

And will produce this HTML when rendered:

```html
<a href="Real Page">Page Alias</a>
```
