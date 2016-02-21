
var bodyParser = require('body-parser');
var expect = require('chai').expect;
var express = require('express');
var expressJsonApi = require('../index');
var Serialiser = require('serialise2jsonapi');
var supertest = require('supertest-as-promised');


describe('express-jsonapi', function () {
  var app;
  var serialiser = new Serialiser('http://localhost', 'id');

  beforeEach(function () {
    app = express();
    app.use(bodyParser.json());
    app.use(expressJsonApi(serialiser));
  });


  describe('response.jsonapi.send', function () {
    it('should work', function () {
      app.get('/', function (request, response) {
        response.jsonapi.send('test', {id: 1, foo: 'bar'});
      });

      return supertest(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /^application\/vnd\.api\+json/)
        .then(function (response) {
          var data = response.body.data;
          expect(data.type).to.equal('test');
          expect(data.id).to.equal(1);
          expect(data.attributes.foo).to.equal('bar');
        });
    });
  });


  describe('response.jsonapi.created', function () {
    it('should work', function () {
      app.get('/', function (request, response) {
        response.jsonapi.created('test', {id: 1, foo: 'bar'});
      });

      return supertest(app)
        .get('/')
        .expect(201)
        .expect('Content-Type', /^application\/vnd\.api\+json/)
        .expect('Location', 'http://localhost/test/1')
        .then(function (response) {
          var data = response.body.data;
          expect(data.type).to.equal('test');
          expect(data.id).to.equal(1);
          expect(data.attributes.foo).to.equal('bar');
        });
    });
  });


  describe('request.jsonapi.sort', function () {
    beforeEach(function () {
      app.get('/', function (request, response) {
        response.json({sort: request.jsonapi.sort()});
      });
    });

    it('should return null for no sort querystring', function () {
      return supertest(app)
        .get('/')
        .expect(200)
        .then(function (response) {
          expect(response.body.sort).to.be.null;
        });
    });

    it('should return a mongodb-style sort object for a given querystring', function () {
      return supertest(app)
        .get('/?sort=foo,-bar')
        .expect(200)
        .then(function (response) {
          expect(response.body.sort).to.eql({foo: 1, bar: -1});
        });
    });
  });


  describe('request.jsonapi.filter', function () {
    beforeEach(function () {
      app.get('/', function (request, response) {
        response.json({filter: request.jsonapi.filter()});
      });
    });

    it('should return null for no filter querystring', function () {
      return supertest(app)
        .get('/')
        .expect(200)
        .then(function (response) {
          expect(response.body.filter).to.be.null;
        });
    });

    it('should return a filter object for a given querystring', function () {
      return supertest(app)
        .get('/?filter[foo]=1&filter[bar]="a"')
        .expect(200)
        .then(function (response) {
          expect(response.body.filter).to.eql({foo: 1, bar: 'a'});
        });
    })
  });


  describe('request.jsonapi.projection', function () {
    beforeEach(function () {
      app.get('/', function (request, response) {
        response.json({projection: request.jsonapi.projection('test')});
      });
    });

    it('should return null for no projection querystring', function () {
      return supertest(app)
        .get('/')
        .expect(200)
        .then(function (response) {
          expect(response.body.projection).to.be.null;
        });
    });

    it('should return a mongodb-style projection object for a given querystring', function () {
      return supertest(app)
        .get('/?fields[test]=foo,bar')
        .expect(200)
        .then(function (response) {
          expect(response.body.projection).to.eql({foo: 1, bar: 1});
        });
    });
  });


  describe('request.jsonapi.paging', function () {
    beforeEach(function () {
      app.get('/:pageSize?', function (request, response) {
        response.json({paging: request.jsonapi.paging(parseInt(request.params.pageSize))});
      });
    });

    it('should return null for no paging querystring', function () {
      return supertest(app)
        .get('/')
        .expect(200)
        .then(function (response) {
          expect(response.body.paging).to.be.null;
        });
    });

    it('should return a paging object for a number-type querystring', function () {
      return supertest(app)
        .get('/?page[size]=10&page[number]=2')
        .expect(200)
        .then(function (response) {
          var paging = response.body.paging;
          expect(paging).to.not.be.null;
          expect(paging.method).to.equal('number');
          expect(paging.size).to.equal(10);
          expect(paging.number).to.equal(2);
          expect(paging.offset).to.equal(10);
          expect(paging.limit).to.equal(10);
        });
    });

    it('should override given default page size', function () {
      return supertest(app)
        .get('/20?page[size]=10&page[number]=2')
        .expect(200)
        .then(function (response) {
          var paging = response.body.paging;
          expect(paging).to.not.be.null;
          expect(paging.method).to.equal('number');
          expect(paging.size).to.equal(10);
          expect(paging.number).to.equal(2);
          expect(paging.offset).to.equal(10);
          expect(paging.limit).to.equal(10);
        });
    });

    it('should default to given page size', function () {
      return supertest(app)
        .get('/20?page[number]=2')
        .expect(200)
        .then(function (response) {
          var paging = response.body.paging;
          expect(paging).to.not.be.null;
          expect(paging.method).to.equal('number');
          expect(paging.size).to.equal(20);
          expect(paging.number).to.equal(2);
          expect(paging.offset).to.equal(20);
          expect(paging.limit).to.equal(20);
        });
    });

    it('should return a paging object for an offset-type querystring', function () {
      return supertest(app)
        .get('/?page[limit]=10&page[offset]=10')
        .expect(200)
        .then(function (response) {
          var paging = response.body.paging;
          expect(paging).to.not.be.null;
          expect(paging.method).to.equal('offset');
          expect(paging.size).to.equal(10);
          expect(paging.number).to.equal(2);
          expect(paging.offset).to.equal(10);
          expect(paging.limit).to.equal(10);
        });
    });

    it('should return a number paging object for no paging querystring if default pagesize is given', function () {
      return supertest(app)
        .get('/10')
        .expect(200)
        .then(function (response) {
          var paging = response.body.paging;
          expect(paging).to.not.be.null;
          expect(paging.method).to.equal('number');
          expect(paging.size).to.equal(10);
          expect(paging.number).to.equal(1);
          expect(paging.offset).to.equal(0);
          expect(paging.limit).to.equal(10);
        });
    });
  });


  describe('request.jsonapi.pagingLinks', function () {
    var paging, count;

    beforeEach(function () {
      app.get('/', function (request, response) {
        var links = request.jsonapi.pagingLinks(paging, count);
        response.json({links: links});
      });
    });

    describe('number type', function () {
      it('should give paging links', function () {
        paging = {
          method: 'number',
          size: 10,
          number: 1
        };

        count = 10;

        return supertest(app)
          .get('/')
          .expect(200)
          .then(function (response) {
            var links = response.body.links;
            expect(links).to.exist;
            expect(links.first).to.equal('~?page[size]=10&page[number]=1');
            expect(links.last).to.equal('~?page[size]=10&page[number]=1');
            expect(links.prev).to.not.exist;
            expect(links.next).to.not.exist;
          });
      });

      it('should give next link when available', function () {
        paging = {
          method: 'number',
          size: 10,
          number: 1
        };

        count = 15;

        return supertest(app)
          .get('/')
          .expect(200)
          .then(function (response) {
            var links = response.body.links;
            expect(links).to.exist;
            expect(links.first).to.equal('~?page[size]=10&page[number]=1');
            expect(links.last).to.equal('~?page[size]=10&page[number]=2');
            expect(links.prev).to.not.exist;
            expect(links.next).to.equal('~?page[size]=10&page[number]=2');
          });
      });

      it('should give prev link when available', function () {
        paging = {
          method: 'number',
          size: 10,
          number: 2
        };

        count = 15;

        return supertest(app)
          .get('/')
          .expect(200)
          .then(function (response) {
            var links = response.body.links;
            expect(links).to.exist;
            expect(links.first).to.equal('~?page[size]=10&page[number]=1');
            expect(links.last).to.equal('~?page[size]=10&page[number]=2');
            expect(links.prev).to.equal('~?page[size]=10&page[number]=1');
            expect(links.next).to.not.exist;
          });
      });
    });


    describe('offset type', function () {
      it('should give paging links', function () {
        paging = {
          method: 'offset',
          limit: 10,
          offset: 0
        };

        count = 10;

        return supertest(app)
          .get('/')
          .expect(200)
          .then(function (response) {
            var links = response.body.links;
            expect(links).to.exist;
            expect(links.first).to.equal('~?page[limit]=10&page[offset]=0');
            expect(links.last).to.equal('~?page[limit]=10&page[offset]=0');
            expect(links.prev).to.not.exist;
            expect(links.next).to.not.exist;
          });
      });

      it('should give next link when available', function () {
        paging = {
          method: 'offset',
          limit: 10,
          offset: 0
        };

        count = 15;

        return supertest(app)
          .get('/')
          .expect(200)
          .then(function (response) {
            var links = response.body.links;
            expect(links).to.exist;
            expect(links.first).to.equal('~?page[limit]=10&page[offset]=0');
            expect(links.last).to.equal('~?page[limit]=10&page[offset]=10');
            expect(links.prev).to.not.exist;
            expect(links.next).to.equal('~?page[limit]=10&page[offset]=10');
          });
      });

      it('should give prev link when available', function () {
        paging = {
          method: 'offset',
          limit: 10,
          offset: 10
        };

        count = 15;

        return supertest(app)
          .get('/')
          .expect(200)
          .then(function (response) {
            var links = response.body.links;
            expect(links).to.exist;
            expect(links.first).to.equal('~?page[limit]=10&page[offset]=0');
            expect(links.last).to.equal('~?page[limit]=10&page[offset]=10');
            expect(links.prev).to.equal('~?page[limit]=10&page[offset]=0');
            expect(links.next).to.not.exist;
          });
      });
    });
  });
});
