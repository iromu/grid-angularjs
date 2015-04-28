'use strict';

describe('Main View', function () {
  var page;

  beforeEach(function () {
    browser.get('/');
    page = require('./main.po');
  });

  it('should include snapshot canvas', function () {
    expect(page.snapshot).not.toBeNull();
  });
});
