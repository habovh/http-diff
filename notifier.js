import http from 'https'

const notifier = async (config, changes) => {
  if (config.webhook) {
    const textChanges = changes.map((change) => `${change.added ? '+' : ''}${change.removed ? '-' : ''}${change.value}`).join('\n')

    const url = new URL(config.webhook.url)
    const httpOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: config.webhook.method,
      headers: config.webhook.headers,
    }
    httpOptions.headers['User-Agent'] = `node ${process.version}`

    await new Promise((resolve, reject) => {
      const request = http.request(httpOptions, (res) => {
        res.on('data', () => {})
          .on('end', () => {
            resolve(res.statusCode)
          })
          .on('error', reject)
      })

      const enhancedBody = config.webhook.body
        .replace('{{name}}', JSON.stringify(config.name))
        .replace('{{diff}}', JSON.stringify(textChanges))
        .replace('{{url}}', JSON.stringify(config.url))
      request.end(enhancedBody)
    })
  }
}

export default notifier
