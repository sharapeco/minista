import fs from "fs-extra"
import { cac } from "cac"

import { getUserConfig } from "./user.js"
import { getConfig } from "./config.js"
import { getViteConfig } from "./vite.js"
import { getMdxConfig } from "./mdx.js"
import { emptyResolveDir } from "./empty.js"
import { createDevServer } from "./server.js"
import {
  generateTempRoot,
  generateTempPages,
  generateAssets,
  generateNoStyleTemp,
  generateHtmlPages,
  generatePublic,
  generateCleanHtml,
} from "./generate.js"
import { previewLocal } from "./preview.js"

function printVersion() {
  const pkgURL = new URL("../package.json", import.meta.url)
  const pkg = JSON.parse(fs.readFileSync(pkgURL, "utf8"))
  const pkgVersion = pkg.version
  return pkgVersion
}

const cli = cac("minista")

cli
  .command("[root]")
  .alias("dev")
  .action(async () => {
    try {
      const userConfig = await getUserConfig()
      const mdxConfig = await getMdxConfig(userConfig)
      const viteConfig = await getViteConfig(userConfig, mdxConfig)

      await createDevServer(viteConfig)
    } catch (err) {
      console.log(err)
      process.exit(1)
    }
  })

cli.command("build [root]").action(async () => {
  try {
    const userConfig = await getUserConfig()
    const config = await getConfig(userConfig)
    const mdxConfig = await getMdxConfig(userConfig)
    const viteConfig = await getViteConfig(userConfig, mdxConfig)

    await Promise.all([
      emptyResolveDir(config.tempRootFileDir),
      emptyResolveDir(config.tempAssetsDir),
      emptyResolveDir(config.tempPagesDir),
      emptyResolveDir(config.outDir),
    ])
    await Promise.all([
      generateTempRoot(config, mdxConfig),
      generateTempPages(config, mdxConfig),
      generateAssets(config, viteConfig),
    ])
    await Promise.all([generateNoStyleTemp(config)])
    await Promise.all([generateHtmlPages(config), generatePublic(config)])
    await Promise.all([generateCleanHtml(config)])
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
})

cli.command("preview [root]").action(async () => {
  try {
    const userConfig = await getUserConfig()
    const viteConfig = await getViteConfig(userConfig)

    await previewLocal(viteConfig)
  } catch (err) {
    console.log(err)
    process.exit(1)
  }
})

cli.help()
cli.version(printVersion())
cli.parse()