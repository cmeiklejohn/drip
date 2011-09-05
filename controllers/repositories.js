var Repository  = require('../models/repository.js').Repository,
    Build       = require('../models/build.js').Build,
    redis       = require('../config/redis.js'),
    resque      = require('../config/resque');

var findOrCreateRepository = require('../lib/repositories.js').findOrCreateRepository,
    triggerRepositoryBuild = require('../lib/repositories.js').triggerRepositoryBuild;

module.exports.create = function(request, response) { 
  if (!request.body && req.is('application/json')) { 
    console.log("Received invalid post:", request.headers['content-type'], request.body);
    response.end();
    return;
  }

  var branch            = "master";
  var repository        = request.body.repository;
  repository.ownerName  = repository.owner.name;
  delete repository.owner;

  if(repository.url.indexOf('http') == 0) { 
    repository.url = repository.url.replace(/\.git$/,"");
  }

  findOrCreateRepository(repository, function(err, repository) { 
    triggerRepositoryBuild(repository, branch, function() {
      response.send("OK");
    });
  });
};

module.exports.list = function (request, response) { 
  var ownerName = request.params.ownerName;

  if(ownerName) { 
    Repository.find({ ownerName: ownerName }, function (err, repositories) { 
      if(err) throw err;
      response.send(repositories);
    });
  } else { 
    Repository.find(function (err, repositories) { 
      if(err) throw err;
      response.send(repositories);
    });
  }
};

module.exports.show = function (request, response) { 
  var name      = request.params.name,
      ownerName = request.params.ownerName;

  Repository.findOne({ ownerName: ownerName, name: name  }, function (err, repository) { 
    if (err) throw err;
    response.send(repository);
  });
};

module.exports.destroy = function (request, response) {
  var name      = request.params.name,
      ownerName = request.params.ownerName;

  Repository.findOne({ ownerName: ownerName, name: name }, function (err, repository) { 
    if (err) throw err;

    if (repository && repository.builds) {

      // loop over each build output in redis and delete it 
      repository.builds.forEach(function (build) {
        redis.del("builds:" + build.id);
      });

    } 
    repository.remove();
    response.end();
  });
};
