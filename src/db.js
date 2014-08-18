// this module merges together human-maintained database
// and automatically fetched data, and normalizes everything

//
// maintainers data
//
var maintainers = module.exports.maintainers = {}
mixin(maintainers, require('./maintainers.json'))
try {
  mixin(maintainers, require('./db.json').maintainers)
} catch(_){}

//
// projects data
//
var projects = module.exports.projects = {}
mixin(projects, require('./projects.json'), true)
try {
  mixin(projects, require('./db.json').projects)
} catch(_){}

// normalize
for (var name in projects) {
  var project = projects[name]
  project.name = project.name || name
  project.npm = project.npm || name.toLowerCase()
  project.repo = project.repo || ('jshttp/' + project.name)
  project.maintainer = maintainers[project.maintainer]
}

//
// helpers
//
function mixin(obj, stuff, sort) {
  var keys = Object.keys(stuff)
  if (sort) keys = keys.sort()
  keys.forEach(function(i) {
    if (typeof(obj[i]) === 'object') {
      mixin(obj[i], stuff[i])
    } else if (!obj[i]) {
      obj[i] = stuff[i]
    }
  })
}

