const { uglify } = require('rollup-plugin-uglify')
const resolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

module.exports = {
  input: 'dist/browser/index.js',
  plugins: [resolve({ browser: true }), uglify(), commonjs()],
  output: {
    name: 'Message',
    file: 'dist/dns-protocol.min.js',
    format: 'umd'
  }
}
