'use strict';

$.fn.drawTouch = function () {
  var ctx = this.initCanvas();

  var start = function (e) {
    e = e.originalEvent;
    ctx.beginPath();
    var x = e.changedTouches[0].pageX;
    var y = e.changedTouches[0].pageY - 44;
    ctx.moveTo(x, y);
  };
  var move = function (e) {
    e.preventDefault();
    e = e.originalEvent;
    var x = e.changedTouches[0].pageX;
    var y = e.changedTouches[0].pageY - 44;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  $(this).on('touchstart', start);
  $(this).on('touchmove', move);
};

// prototype to	start drawing on pointer(microsoft ie) using canvas moveTo and lineTo
$.fn.drawPointer = function () {
  var ctx = this.initCanvas();

  var start = function (e) {
    e = e.originalEvent;
    ctx.beginPath();
    var x = e.pageX;
    var y = e.pageY - 44;
    ctx.moveTo(x, y);
  };
  var move = function (e) {
    e.preventDefault();
    e = e.originalEvent;
    var x = e.pageX;
    var y = e.pageY - 44;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  $(this).on('MSPointerDown', start);
  $(this).on('MSPointerMove', move);
};
// prototype to	start drawing on mouse using canvas moveTo and lineTo
$.fn.initCanvas = function () {
  var ctx = this.get(0).getContext('2d');
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 20;
  return ctx;
};
$.fn.drawMouse = function () {
  var ctx = this.initCanvas();
  var clicked = 0;
  var start = function (e) {
    clicked = 1;
    ctx.beginPath();
    var x = e.pageX;
    var y = e.pageY - 44;
    ctx.moveTo(x, y);
  };
  var move = function (e) {
    if (clicked === 1) {
      e.preventDefault();
      var x = e.pageX;
      var y = e.pageY - 44;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };
  var stop = function (e) {
    clicked = 0;
  };
  $(this).on('mousedown', start);
  $(this).on('mousemove', move);
  $(window).on('mouseup', stop);
};
