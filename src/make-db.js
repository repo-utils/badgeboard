#!/usr/bin/node --harmony

// This script fetches different info from remote servers.
//
// It could take a lot of time later, so it's inadvisable
// to run it on every build.

var request = require('request')
var YAML = require('js-yaml')

var data = {}
var projects = require('./projects.json').map(function (project) {
  if (typeof project === 'string') project = { name: project }
  project.npm = project.npm || project.name.toLowerCase()
  project.repo = project.repo || ('jshttp/' + project.npm)
  data[project.name] = {}
  return project
})

require('co')(function *() {
  yield [getInfoFromNpm, getInfoFromGithub]

  // it's pretty-printed only for git diffs, don't edit that manually
  console.log(JSON.stringify(data, null, 2))
})()


//
// Generators
// 

function *getNpmInfo(pkg) {
  return JSON.parse(yield get('https://registry.npmjs.org/' + pkg))
}

function *getTravis(repo) {
  return YAML.safeLoad(yield get('https://raw.githubusercontent.com/'
                                 + repo + '/master/.travis.yml'))
}

function *getInfoFromNpm() {
  for (var i=0; i<projects.length; i++) {
    var npm = yield getNpmInfo(projects[i].npm)
    var name = projects[i].name
    data[name].description = npm.description
    data[name].npmUser =
      npm.versions[npm['dist-tags'].latest]._npmUser.name
  }
}

function *getInfoFromGithub() {
  for (var i=0; i<projects.length; i++) {
    var travis = yield getTravis(projects[i].repo)
    var name = projects[i].name
    data[name].nodeVersion = travis.node_js.sort(versionSort)[0]
  }
}

//
// Helpers
//

function get(url) {
  return function(cb) {
    console.error(' -> ' + url)
    request.get({
      url: url,
      encoding: 'utf8',
    }, function(err, res, body) {
      cb(err, body)
    })
  }
}

function versionSort(a, b) {
  a = a.split('.')
  b = b.split('.')
  if (a[0] != b[0]) return a[0] - b[0]
  return a[1] - b[1]
}
