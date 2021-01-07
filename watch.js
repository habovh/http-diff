import check from './index.js'

const cancellableWait = (duration) => {
  let finished = false
  let cancel = () => finished = true

  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, duration)

    cancel = () => {
      if (finished) {
        return;
      }
      clearTimeout(timeout)
      reject(new Error('Timeout cancelled'))
    }

    if (finished) {
      cancel();
    }
  })

  return { promise, cancel }
}

const main = async () => {
  let exit = false
  let wait

  process.on('SIGINT', () => {
    console.log('Will exit...')
    wait.cancel()
    exit = true
  })

  try {
    while (!exit) {
      wait = cancellableWait(60000)
      process.stdout.write('.')
      await check()
      await wait.promise
    }
  } catch (e) {
    if (e.message === 'Timeout cancelled') return console.log('Timer stopped')
    throw e
  }
}

main()
