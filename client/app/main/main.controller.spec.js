'use strict';

describe('Controller: MainController', function () {

  // load the controller's module
  beforeEach(module('gridApp'));
  beforeEach(module('socketMock'));

  var MainController,
      scope,
      $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/pixels')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    scope = $rootScope.$new();
    MainController = $controller('MainController', {
      $scope: scope
    });
  }));

  it('should attach a list of pixels to the scope', function () {
   // $httpBackend.flush();
    //expect(scope.pixelBuffer.length).toBe(4);
  });
});
