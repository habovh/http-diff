# http-diff

A Node utility to watch and notify website changes

## Features

- [x] Watch list
- [ ] POST & GET webhooks
  - [x] Configurable tokens in body
  - [ ] Configurable tokens in url
- [ ] Threshold settings
- [ ] Text/HTML settings

## Install

```terminal
$ git clone
$ yarn
```

## Usage

You can run the script manually, but it was intended to be used as part of a cron task. The process exits once every entry has been checked and prevents multiple watcher process from being launched.

```terminal
$ node index.js
```

## Configuration

Configuration takes place in a `config.json` file in the root folder.

You can use this type to help you build it:

```ts
type Config = {
  browser: {
    name: 'chrome' | 'firefox',
    binary?: string,
    args?: string[]
  },
  watchlist: [
    {
      name?: string,
      url: string,
      selector?: string,
      json?: boolean,
      webhook?: {
        method: 'POST' | 'GET',
        url: string,
        body?: string,
        headers?: { [string]: string }
      }
    }
  ]
}
```

### Tokens

Tokens can be used in webhook body string to send entry-specific parameters.

| Token | Description |
| --- | --- |
| `{{name}}` | The entry name |
| `{{url}}` | The entry URL |
| `{{diff}}` | A textual diff of line changes |