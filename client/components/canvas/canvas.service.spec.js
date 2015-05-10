'use strict';

describe('Service: canvasViewService', function () {

  // load the service's module
  beforeEach(module('gridApp'));

  // instantiate service
  var canvasViewService;
  beforeEach(inject(function (_canvasViewService_) {
    canvasViewService = _canvasViewService_;
  }));

  it('should exist', function () {
    expect(!!canvasViewService).toBe(true);
  });

  it('should calcWindowSlice', function () {
    expect(canvasViewService.calcWindowSlice(1, 200, 200, 20)).toEqual({
      region: 1,
      size: 20,
      col: 1,
      row: 1,
      x: 0,
      y: 0
    });
    expect(canvasViewService.calcWindowSlice(2, 200, 200, 20)).toEqual({
      region: 2,
      size: 20,
      col: 2,
      row: 1,
      x: 19,
      y: 0
    });
    expect(canvasViewService.calcWindowSlice(9, 200, 200, 20)).toEqual({
      region: 9,
      size: 20,
      col: 9,
      row: 1,
      x: 159,
      y: 0
    });
    expect(canvasViewService.calcWindowSlice(10, 200, 200, 20)).toEqual({
      region: 10,
      size: 20,
      col: 10,
      row: 1,
      x: 179,
      y: 0
    });
    expect(canvasViewService.calcWindowSlice(11, 200, 200, 20)).toEqual({
      region: 11,
      size: 20,
      col: 1,
      row: 2,
      x: 0,
      y: 19
    });
    expect(canvasViewService.calcWindowSlice(12, 200, 200, 20)).toEqual({
      region: 12,
      size: 20,
      col: 2,
      row: 2,
      x: 19,
      y: 19
    });
    expect(canvasViewService.calcWindowSlice(20, 200, 200, 20)).toEqual({
      region: 20,
      size: 20,
      col: 10,
      row: 2,
      x: 179,
      y: 19
    });
    expect(canvasViewService.calcWindowSlice(31, 200, 200, 20)).toEqual({
      region: 31,
      size: 20,
      col: 1,
      row: 4,
      x: 0,
      y: 59
    });
    expect(canvasViewService.calcWindowSlice(41, 200, 200, 20)).toEqual({
      region: 41,
      size: 20,
      col: 1,
      row: 5,
      x: 0,
      y: 79
    });
    expect(canvasViewService.calcWindowSlice(30, 200, 200, 20)).toEqual({
      region: 30,
      size: 20,
      col: 10,
      row: 3,
      x: 179,
      y: 39
    });
    expect(canvasViewService.calcWindowSlice(40, 200, 200, 20)).toEqual({
      region: 40,
      size: 20,
      col: 10,
      row: 4,
      x: 179,
      y: 59
    });
    expect(canvasViewService.calcWindowSlice(50, 200, 200, 20)).toEqual({
      region: 50,
      size: 20,
      col: 10,
      row: 5,
      x: 179,
      y: 79
    });
    expect(canvasViewService.calcWindowSlice(51, 200, 200, 20)).toEqual({
      region: 51,
      size: 20,
      col: 1,
      row: 6,
      x: 0,
      y: 99
    });
  });

});
