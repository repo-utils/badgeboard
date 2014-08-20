// this module merges together config file and automatically
// fetched data, and normalizes everything after that

var yaml = require('js-yaml')
var fs = require('fs')
var config = fs.readFileSync(__dirname + '/config.yaml', 'utf8')
module.exports = config = yaml.safeLoad(config)

try {
  // this file might not exist if we're
  // building db.json for the first time
  var db = require('./db.json')
} catch(_) {
  db = {projects: {}, maintainers: {}}
}

//
// maintainers data
//
config.maintainers = config.maintainers.map(function(maintainer) {
  if (db.maintainers[maintainer.npm])
    mixin(maintainer, db.maintainers[maintainer.npm])

  return maintainer
})

//
// projects data
//
config.projects = config.projects.map(function(project) {
  if (typeof(project) === 'string') project = {name: project}

  // dealing with a bit weird edge-case in config file
  // {vary: {blah: blah}} -> {name: vary, blah: blah}
  var keys = Object.keys(project)
  if (keys.length === 1 && !project.name) {
    project = project[keys[0]]
    project.name = keys[0]
  }

  if (db.projects[project.name])
    mixin(project, db.projects[project.name])

  // normalize
  project.npm = project.npm || project.name.toLowerCase()
  project.repo = project.repo || (config.name + '/' + project.name)
  project.maintainer = config.maintainers.filter(function(m) {
    return m.npm === project.maintainer
  })[0]
  return project
})

//
// helpers
//
function mixin(obj, stuff) {
  Object.keys(stuff).forEach(function(i) {
    if (typeof(obj[i]) === 'object') {
      mixin(obj[i], stuff[i])
    } else if (!obj[i]) {
      obj[i] = stuff[i]
    }
  })
}

