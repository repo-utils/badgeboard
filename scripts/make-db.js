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
var config = require('./config')
var maintainersDB = config.maintainers
maintainersDB.forEach(function (maintainer) {
  data.maintainers[maintainer.npm] = {}
})
var projectsDB = config.projects
projectsDB.forEach(function (project) {
  data.projects[project.name] = {}
})

require('co')(function *() {
  yield [getInfoFromNpm, getInfoFromGithub, getMaintainersInfo]

  // it's pretty-printed only for git diffs, don't edit that manually
  var json = JSON.stringify(data, null, 2)
  require('fs').writeFileSync(__dirname + '/db.json', json)
})()


//
// Generators
// 

function *getNpmInfo(pkg) {
  return JSON.parse(yield get('https://registry.npmjs.org/' + pkg))
}

function *getTravis(repo) {
  var result = yield get('https://raw.githubusercontent.com/'
                         + repo + '/master/.travis.yml')
  try {
    return YAML.safeLoad(result)
  } catch(_) {
    return {}
  }
}

function *getUserInfo(user) {
  return JSON.parse(yield get('https://registry.npmjs.org/'
                              + '_users/org.couchdb.user:' + user))
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
    if (config['db.json'].maintainers.packages)
      mData.packages = yield getOwnedPackages(name)

    if (config['db.json'].maintainers.avatar)
      mData.avatar = (yield getUserInfo(name)).avatar
  }
}

function *getInfoFromNpm() {
  if (!config['db.json'].projects.maintainer
   && !config['db.json'].projects.description) return

  for (var i=0; i<projectsDB.length; i++) {
    var project = projectsDB[i]
    var npm = yield getNpmInfo(project.npm)
    var projectData = data.projects[project.name]
    projectData.description = npm.description
    projectData.maintainer =
      npm.versions[npm['dist-tags'].latest]._npmUser.name
  }
}

function *getInfoFromGithub() {
  if (!config['db.json'].projects.node) return
  for (var i=0; i<projectsDB.length; i++) {
    var project = projectsDB[i]
    var travis = yield getTravis(project.repo)
    var projectData = data.projects[project.name]
    if (travis.node_js) {
      projectData.node = travis.node_js.sort(versionSort)[0]
    }
  }
}

//
// Helpers
//

function get(url) {
  return function(cb) {
    console.log(' -> ' + url.split('?')[0])
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
