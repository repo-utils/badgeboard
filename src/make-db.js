#!/usr/bin/node --harmony

// This script fetches different info from remote servers.
//
// It could take a lot of time later, so it's inadvisable
// to run it on every build.

var request = require('request')
var YAML = require('js-yaml')

var data = {
  projects: {},
  maintainers: {},
}
var maintainersDB = require('./db').maintainers
var npmUserToName = {}
Object.keys(maintainersDB).forEach(function (maintainer) {
  data.maintainers[maintainer] = {}
  npmUserToName[maintainersDB[maintainer].npm] = maintainer
})
var projectsDB = require('./db').projects
Object.keys(projectsDB).forEach(function (project) {
  data.projects[project] = {}
})

require('co')(function *() {
  yield [getInfoFromNpm, getInfoFromGithub, getMaintainersInfo]

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

function *getOwnedPackages(user) {
  var data = yield get('http://isaacs.iriscouch.com/'
                     + 'registry/_design/app/_view/browseAuthors'
                     + '?startkey=' + escapeJSON([user])
                     + '&endkey=' + escapeJSON([user, {}])
                     + '&group_level=1') // set group_level=2 for list
  return JSON.parse(data).rows[0].value
}

function *getMaintainersInfo() {
  for (var name in data.maintainers) {
    var mData = data.maintainers[name]
    mData.packages = yield getOwnedPackages(maintainersDB[name].npm)
  }
}

function *getInfoFromNpm() {
  for (var name in projectsDB) {
    var npm = yield getNpmInfo(projectsDB[name].npm)
    var projectData = data.projects[name]
    projectData.description = npm.description
    projectData.maintainer =
      npmUserToName[npm.versions[npm['dist-tags'].latest]._npmUser.name]
  }
}

function *getInfoFromGithub() {
  for (var name in projectsDB) {
    var travis = yield getTravis(projectsDB[name].repo)
    var projectData = data.projects[name]
    projectData.node = travis.node_js.sort(versionSort)[0]
  }
}

//
// Helpers
//

function get(url) {
  return function(cb) {
    console.error(' -> ' + url.split('?')[0])
    request.get({
      url: url,
      encoding: 'utf8',
    }, function(err, res, body) {
      cb(err, body)
    })
  }
}

// for couchdb
function escapeJSON(data) {
  return encodeURIComponent(JSON.stringify(data))
}

function versionSort(a, b) {
  a = a.split('.')
  b = b.split('.')
  if (a[0] != b[0]) return a[0] - b[0]
  return a[1] - b[1]
}
