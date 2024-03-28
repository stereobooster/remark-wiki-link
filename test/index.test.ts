import unified from 'unified'
import markdown from 'remark-parse'
import visit from 'unist-util-visit'
import remark2markdown from 'remark-stringify'
import { Node, Data } from 'unist'

import wikiLinkPlugin, { wikiLinkPlugin as namedWikiLinkPlugin } from '../src'
import select from 'unist-util-select'

interface WikiLinkHProperties {
  href: string;
  [key: string]: unknown;
}

interface WikiLinkData extends Data {
  permalink: string;
  hProperties: WikiLinkHProperties;
  hChildren: Array<{value: string}>
}

interface WikiLinkNode extends Node {
  data: WikiLinkData;
}

interface LinkTemplateOptions {
  slug: string;
  permalink?: string;
  alias?: string;
}

function assertWikiLink (obj: Node): asserts obj is WikiLinkNode {
  if (!obj.data || !('alias' in obj.data) || !('permalink' in obj.data)) {
    throw new Error('Not a wiki link')
  }
}

describe('remark-wiki-link', () => {
  test('parses a wiki link', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin)

    let ast = processor.parse('[[Wiki Link]]')
    ast = processor.runSync(ast)

    visit(ast, 'wikiLink', (node) => {
      assertWikiLink(node)

      expect(node.data.permalink).toEqual(undefined)
      expect(node.data.hName).toEqual('a')
      expect(node.data.hProperties.href).toEqual('Wiki Link')
      expect(node.data.hChildren[0].value).toEqual('Wiki Link')
    })
  })

  test('handles wiki links with aliases', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin)

    let ast = processor.parse('[[Real Page:Page Alias]]')
    ast = processor.runSync(ast)

    visit(ast, 'wikiLink', (node) => {
      assertWikiLink(node)

      expect(node.data.permalink).toEqual(undefined)
      expect(node.data.hName).toEqual('a')
      expect(node.data.alias).toEqual('Page Alias')
      expect(node.value).toEqual('Real Page')
      expect(node.data.hProperties.href).toEqual('Real Page')
      expect(node.data.hChildren[0].value).toEqual('Page Alias')
    })
  })

  test('handles wiki alias links with custom divider', () => {
    const processor = unified()
      .use(markdown)
      .use(wikiLinkPlugin, {
        aliasDivider: '|'
      })

    let ast = processor.parse('[[Real Page|Page Alias]]')
    ast = processor.runSync(ast)

    visit(ast, 'wikiLink', node => {
      assertWikiLink(node)

      expect(node.data.permalink).toEqual(undefined)
      expect(node.data.hName).toEqual('a')
      expect(node.data.alias).toEqual('Page Alias')
      expect(node.value).toEqual('Real Page')
      expect(node.data.hProperties.href).toEqual('Real Page')
      expect(node.data.hChildren[0].value).toEqual('Page Alias')
    })
  })

  test('stringifies wiki links', () => {
    const processor = unified()
      .use(markdown)
      .use(remark2markdown)
      .use(wikiLinkPlugin)

    const stringified = processor.processSync('[[Wiki Link]]').contents.toString().trim()
    expect(stringified).toEqual('[[Wiki Link]]')
  })

  test('stringifies aliased wiki links', () => {
    const processor = unified()
      .use(markdown)
      .use(remark2markdown)
      .use(wikiLinkPlugin)

    const stringified = processor.processSync('[[Real Page:Page Alias]]').contents.toString().trim()
    expect(stringified).toEqual('[[Real Page:Page Alias]]')
  })

  describe('configuration options', () => {
    test('uses linkResolver', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          linkResolver: (x: string) => x.toLowerCase().replace(' ', '_')
        })

      let ast = processor.parse('[[A Page]]')
      ast = processor.runSync(ast)

      visit(ast, 'wikiLink', (node) => {
        assertWikiLink(node)
        expect(node.data.permalink).toEqual('a_page')
        expect(node.data.hProperties.href).toEqual('a_page')
      })
    })

    test('uses linkTemplate', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          linkTemplate: ({ slug, permalink, alias }:LinkTemplateOptions) => ({
            hName: 'span',
            hProperties: { 'data-href': permalink || slug },
            hChildren: [{ type: 'text', value: alias || slug }]
          })
        })

      let ast = processor.parse('[[A Page]]')
      ast = processor.runSync(ast)

      visit(ast, 'wikiLink', (node) => {
        assertWikiLink(node)
        expect(node.data.hName).toEqual('span')
        expect(node.data.hProperties['data-href']).toEqual('A Page')
        expect(node.data.hChildren[0].value).toEqual('A Page')
      })
    })
  })

  describe('open wiki links', () => {
    test('handles open wiki links', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin)

      let ast = processor.parse('t[[\nt')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links at end of file', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin)

      let ast = processor.parse('t [[')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links with partial data', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin)

      let ast = processor.parse('t [[tt\nt')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links with partial alias divider', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          aliasDivider: '::'
        })

      let ast = processor.parse('[[t::\n')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })

    test('handles open wiki links with partial alias', () => {
      const processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin)

      let ast = processor.parse('[[t:\n')
      ast = processor.runSync(ast)

      expect(!select.select('wikiLink', ast)).toBeTruthy()
    })
  })

  test('exports the plugin with named exports', () => {
    expect(wikiLinkPlugin).toEqual(namedWikiLinkPlugin)
  })
})
