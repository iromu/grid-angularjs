'use strict';

import service from './pixel.service';


function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

export function snapshot(req, res) {
  var withKey = 'pixels:snapshot:' + req.params.room;

  service.retrievePNGStreamFor(withKey, res, 'raw', 1)
    .catch(handleError(res));
}

export function preview(req, res) {
  var withKey = 'pixels:preview:' + req.params.room;
  service.retrievePNGStreamFor(withKey, res, req.params.room, 1)
    .catch(handleError(res));
}


