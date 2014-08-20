
var fs = require('fs')
var path = require('path')
var jade = require('jade')

var index = path.join(__dirname, 'index.jade')
var out = path.join(__dirname, '../index.html')
var config = require('./config')

var src = fs.readFileSync(index, 'utf8')

var fn = jade.compile(src, {
  compileDebug: false,
  filename: index,
})

var html = fn(config)

fs.writeFileSync(out, html)
