import WebdriverIO from 'webdriverio'
import { diffLines } from 'diff'
import fs from 'fs'

import notifier from './notifier.js'

const configs = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))

const main = async () => {
  const browser = await WebdriverIO.remote({
    capabilities: { browserName: 'chrome' },
    logLevel: 'warn',
  })

  for (let index = 0; index < configs.length; index += 1) {
    const config = configs[index]

    if (!config.url) {
      console.warn(`Missing required 'url' key in config at index ${index}, skipping.`)
      break
    }

    await browser.navigateTo(config.url)

    const node = await browser.$(config.selector || 'body')

    await node.waitForExist({ timeout: 10000 })

    const html = await node.getHTML()

    let state = {}

    if (fs.existsSync('./state.json')) {
      state = JSON.parse(fs.readFileSync('./state.json', 'utf-8'))
    }

    // Compare
    const oldHtml = state[config.url]
    if (oldHtml) {
      const diff = diffLines(html, oldHtml, { ignoreWhitespace: true })
      const changes = diff.filter((change) => change.added || change.removed)
      if (changes.length > 0) {
        await notifier(config, changes)
      }
    }

    // Store
    state[config.url] = html
    fs.writeFileSync('./state.json', JSON.stringify(state))
  }

  await browser.deleteSession()
}

main()
