
var fs = require('fs')
var path = require('path')
var jade = require('jade')

var index = path.join(__dirname, 'index.jade')
var out = path.join(__dirname, '../index.html')

var projects = require('./db').projects
var maintainers = require('./db').maintainers

var src = fs.readFileSync(index, 'utf8')

var fn = jade.compile(src, {
  compileDebug: false,
  filename: index,
})

var html = fn({
  projects: projects,
  maintainers: maintainers,
  style: 'flat-square',
  title: 'badgeboard'
  description: 'project status at a glance'
  keywords: 'badgeboard, repo-utils'
})

fs.writeFileSync(out, html)
