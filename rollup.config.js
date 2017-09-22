import uglify from 'rollup-plugin-uglify'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: 'dist/browser/browser.js',
  name: 'Message',
  plugins: [resolve(), uglify()],
  output: {
    file: 'dist/dns-protocol.min.js',
    format: 'umd'
  }
}
