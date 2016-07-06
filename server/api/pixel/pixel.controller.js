(function () {

  'use strict';

  var service = require('./pixel.service.js');

  exports.snapshot = function (req, res) {
    var withKey = 'pixels:snapshot:' + req.params.room;

    service.retrievePNGStreamFor(withKey, res, 'raw', 1)
      .catch(function (err) {
        handleError(res, err);
      });
  };

  exports.preview = function (req, res) {
    var withKey = 'pixels:preview:' + req.params.room;
    service.retrievePNGStreamFor(withKey, res, req.params.room, 1)
      .catch(function (err) {
        handleError(res, err);
      });
  };

  function handleError(res, err) {
    return res.status(500).send(err);
  }


}());
