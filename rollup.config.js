import uglify from 'rollup-plugin-uglify'
import resolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'dist/browser/browser.js',
  dest: 'dist/dns-protocol.min.js',
  format: 'umd',
  moduleName: 'DnsProtocol',
  plugins: [resolve(), uglify()]
}
