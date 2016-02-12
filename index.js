
function middleware(serialiser) {
  return function (request, response, next) {
    request.jsonapi = {
      sort: parseSort.bind(request),
      filter: parseFilter.bind(request),
      projection: parseProjection.bind(request),
      paging: parsePaging.bind(request)
    };

    response.jsonapi = {
      send: send.bind(response),
      created: created.bind(response)
    };

    next();
  };

  function send(resource, data, links) {
    var response = serialiser.serialise(resource, data, links);

    this
      .set('Content-Type', 'application/vnd.api+json')
      .json(response);
  }

  function created(resource, data, links) {
    var response = serialiser.serialise(resource, data, links);

    this
      .status(201)
      .set('Location', response.links.self)
      .set('Content-Type', 'application/vnd.api+json')
      .json(response);
  }
}


function errorHandler(serialiser, logger) {
  function (error, request, response, next) {
    if (logger)
      logger(error);

    response
      .status(parseInt(error.status) || 500)
      .json(serialiser.serialise('', error));
  };
}
