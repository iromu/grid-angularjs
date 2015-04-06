'use strict';

describe('Service: canvasViewService', function () {

  // load the service's module
  beforeEach(module('gridApp'));

  // instantiate service
  var canvasViewService;
  beforeEach(inject(function (_canvasViewService_) {
    canvasViewService = _canvasViewService_;
  }));

  it('should do something', function () {
    expect(!!canvasViewService).toBe(true);
  });

});
