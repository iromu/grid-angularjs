'use strict';

var _ = require('lodash');
var Nn = require('./nn.model');

// Get list of nns
exports.index = function (req, res) {
  Nn.find(function (err, nns) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(200, nns);
  });
};

// Get a single nn
exports.show = function (req, res) {
  Nn.findById(req.params.id, function (err, nn) {
    if (err) {
      return handleError(res, err);
    }
    if (!nn) {
      return res.send(404);
    }
    return res.json(nn);
  });
};

// Creates a new nn in the DB.
exports.create = function (req, res) {
  Nn.create(req.body, function (err, nn) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(201, nn);
  });
};

// Updates an existing nn in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Nn.findById(req.params.id, function (err, nn) {
    if (err) {
      return handleError(res, err);
    }
    if (!nn) {
      return res.send(404);
    }
    var updated = _.merge(nn, req.body);
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, nn);
    });
  });
};

// Deletes a nn from the DB.
exports.destroy = function (req, res) {
  Nn.findById(req.params.id, function (err, nn) {
    if (err) {
      return handleError(res, err);
    }
    if (!nn) {
      return res.send(404);
    }
    nn.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
