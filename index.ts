import { Node, Parser } from "commonmark"
import * as fm from "front-matter"

export interface MarkDownEx {
  readonly frontMatter?: string
  readonly markDown: Node
}

export const parse = (fileContent: string): MarkDownEx => {
  const result = fm(fileContent)
  const parser = new Parser()
  return {
    frontMatter: result.frontmatter,
    markDown: parser.parse(result.body)
  }
}

export const markDownExToString = (mde: MarkDownEx): string => {
  const md = commonmarkToString(mde.markDown)
  return mde.frontMatter === undefined ? md : `---\n${mde.frontMatter}\n---\n${md}`
}

function commonmarkToString(root: Node) {
  let walker = root.walker();
  let event;
  let output = "";
  while ((event = walker.next())) {
    let curNode = event.node;

    const leaving = render.leaving[curNode.type]
    if (!event.entering && leaving !== undefined) {
      output += leaving(curNode, event.entering);
    }
    const entering = render.entering[curNode.type]
    if (event.entering && entering !== undefined) {
      output += entering(curNode, event.entering);
    }
  }

  output = output.replace(/\n$/, "");

  return output;
}

type Func = (node: Node, b: unknown) => unknown

interface Render {
  readonly entering: {
    readonly [key: string]: Func|undefined
  }
  readonly leaving: {
    readonly [key: string]: Func|undefined
  }
}

// See this PR https://github.com/DefinitelyTyped/DefinitelyTyped/pull/28538
// for more information.
type ListType = "bullet"|"ordered"

const render : Render = {
  entering: {
    text: (node: Node) => node.literal,
    softbreak: (node: Node) => "\n",
    linebreak: (node: Node) => "\n",
    emph: (node: Node) => "*",
    strong: (node: Node) => "**",
    html_inline: (node: Node) => "`",
    link: (node: Node) => "[",
    image: (node: Node) => {},
    code: (node: Node) => `\`${node.literal}\``,
    document: (node: Node) => "",
    paragraph: (node: Node) => "",
    block_quote: (node: Node) => "> ",
    item: (node: Node) =>
      `${{ bullet: "*", ordered: `1${node.listDelimiter}` }[node.listType as ListType]} `,
    list: (node: Node) => "",
    heading: (node: Node) =>
      Array(node.level)
        .fill("#")
        .join("") + " ",
    code_block: (node: Node) =>
      `\`\`\` ${node.info}\n${node.literal}\`\`\`\n\n`,
    html_block: (node: Node) => node.literal,
    thematic_break: (node: Node) => "---\n\n",
    custom_inline: (node: Node) => {},
    custom_block: (node: Node) => {},
  },

  leaving: {
    paragraph: (node: Node) => "\n\n",
    link: (node: Node) => `](${node.destination})`,
    strong: (node: Node) => "**",
    emph: (node: Node) => "*",
  }
};
