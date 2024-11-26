// middlewares/setHeader.js:
export default function ({ req, res }) {
  console.log(req.path)
  return res?.setHeader('X-Hello', 'World')
}
