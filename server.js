const next = require('next')
const http = require('http')

const app = next({ dev: false })
const handle = app.getRequestHandler()

const port = process.env.PORT || 3000

app.prepare().then(() => {
  http.createServer((req, res) => {
    handle(req, res)
  }).listen(port, () => {
    console.log(`Running on port ${port}`)
  })
})