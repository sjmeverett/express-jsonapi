
var _ = require('lodash/fp');

function middleware(serialiser) {
  return function (request, response, next) {
    request.jsonapi = {
      sort: parseSort.bind(request),
      filter: parseFilter.bind(request),
      projection: parseProjection.bind(request),
      paging: parsePaging.bind(request),
      pagingLinks: getPagingLinks
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


function parseSort() {
  if (this.query.sort) {
    return _.reduce(function (o, field) {
      if (field[0] === '-') {
        o[field.substring(1)] = -1;
      } else {
        o[field] = 1;
      }

      return o;
    }, {}, this.query.sort.split(','));

  } else {
    return null;
  }
}


function parseFilter() {
  if (this.query.filter) {
    return _.mapValues(JSON.parse, this.query.filter);

  } else {
    return null;
  }
}


function parseProjection(type) {
  if (this.query.fields && this.query.fields[type]) {
    return _.reduce(function (o, field) {
        o[field] = 1;
        return o;
      }, {}, this.query.fields[type].split(','));

  } else {
    return null;
  }
}


function parsePaging(defaultPageSize) {
  if (this.query.page || defaultPageSize) {
    var page = _.mapValues(parseInt, this.query.page) || {};

    // can't compare to undefined because they might be NaN if user supplied guff
    if (page.limit || page.offset) {
      page.method = 'offset';
      page.limit = page.limit || page.size || defaultPageSize;
      page.offset = page.offset || 0;
      page.size = page.limit;
      page.number = page.offset / page.size + 1;

    } else {
      page.method = 'number';
      page.size = page.size || defaultPageSize;
      page.number = page.number || 1;
      page.limit = page.size;
      page.offset = (page.number - 1) * page.size;
    }

    return page;

  } else {
    return null;
  }
}


function getPagingLinks(page, count) {
  var links;
  var pageCount = Math.ceil(count / (page.size || page.limit));

  if (page.method === 'number') {
    links = {
      first: '~?page[size]=' + page.size + '&page[number]=1',
      last: '~?page[size]=' + page.size + '&page[number]=' + pageCount || 1
    };

    if (page.number > 1) {
      links.prev = '~?page[size]=' + page.size + '&page[number]=' + (page.number - 1);
    }

    if (page.number < pageCount) {
      links.next = '~?page[size]=' + page.size + '&page[number]=' + (page.number + 1);
    }

  } else {
    links = {
      first: '~?page[limit]=' + page.limit + '&page[offset]=0',
      last: '~?page[limit]=' + page.limit + '&page[offset]=' + ((pageCount - 1) * page.limit)
    };

    if (page.offset > 0) {
      links.prev = '~?page[limit]=' + page.limit + '&page[offset]=' + Math.max(0, page.offset - page.limit);
    }

    if ((page.offset + page.limit) < count) {
      links.next = '~?page[limit]=' + page.limit + '&page[offset]=' + (page.offset + page.limit);
    }
  }

  return links;
}


function errorHandler(serialiser, logger) {
  return function (error, request, response, next) {
    if (logger)
      logger(error);

    response
      .status(parseInt(error.status) || 500)
      .json(serialiser.serialise('', error));
  };
}

module.exports = middleware;
module.errorHandler = errorHandler;
