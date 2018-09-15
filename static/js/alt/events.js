var alt_events = (function () {

var exports = {};

exports.handle = function (events) {
    blueslip.log(events);
};

return exports;

}());
window.alt_events = alt_events;
