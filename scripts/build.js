
var fs = require('fs')
var path = require('path')
var jade = require('jade')

var index = path.join(__dirname, '../templates/index.jade')
var out = path.join(__dirname, '../index.html')
var config = require('./config')

var src = fs.readFileSync(index, 'utf8')

var fn = jade.compile(src, {
  compileDebug: false,
  filename: index,
  pretty: true
})

var html = fn(config)

fs.writeFileSync(out, html)
