import uglify from 'rollup-plugin-uglify'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'dist/browser/index.js',
  name: 'Message',
  plugins: [resolve(), uglify(), commonjs()],
  output: {
    file: 'dist/dns-protocol.min.js',
    format: 'umd'
  }
}
