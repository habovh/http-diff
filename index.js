import WebdriverIO from 'webdriverio'
import { diffLines } from 'diff'
import fs from 'fs'

import notifier from './notifier.js'

const main = async () => {
  if (!fs.existsSync('./config.json')) {
    console.warn('No configuration file found, exiting.')
    return
  }

  const configString = fs.readFileSync('./config.json', 'utf-8')

  try {
    JSON.parse(configString)
  } catch (e) {
    console.warn('Invalid configuration file, exiting.')
    return
  }
  
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))

  if (!Array.isArray(config.watchlist) || config.watchlist.length === 0) {
    console.warn('No entry in watchlist, exising.')
    return
  }

  const browserConfig = {
    capabilities: {
      browserName: config.browser?.name || 'chrome',
    },
    logLevel: 'warn',
  }

  if (config.browser?.name === 'chrome') {
    browserConfig.capabilities['goog:chromeOptions'] = {
      binary: config.browser.binary,
      args: config.browser.args,
    }
  }
  if (config.browser?.name === 'firefox') {
    browserConfig.capabilities['moz:firefoxOptions'] = {
      args: config.browser.args,
      binary: config.browser.binary,
    }
  }

  const browser = await WebdriverIO.remote(browserConfig)

  const watchlist = config.watchlist

  for (let index = 0; index < watchlist.length; index += 1) {
    const watchEntry = watchlist[index]
    if (!watchEntry) {
      console.warn(`Invalid watchlist entry at index ${index}, skipping.`)
      break
    }

    if (!watchEntry.url) {
      console.warn(`Missing required 'url' key in config at index ${index}, skipping.`)
      break
    }

    await browser.navigateTo(watchEntry.url)

    const node = await browser.$(watchEntry.selector || 'body')

    await node.waitForExist({ timeout: 10000 })

    const html = await node.getHTML()

    let state = {}

    if (fs.existsSync('./state.json')) {
      state = JSON.parse(fs.readFileSync('./state.json', 'utf-8'))
    }

    // Compare
    const oldHtml = state[watchEntry.url]
    if (oldHtml) {
      const diff = diffLines(html, oldHtml, { ignoreWhitespace: true })
      const changes = diff.filter((change) => change.added || change.removed)
      if (changes.length > 0) {
        await notifier(watchEntry, changes)
      }
    }

    // Store
    state[watchEntry.url] = html
    fs.writeFileSync('./state.json', JSON.stringify(state))
  }

  await browser.deleteSession()
}

main()
