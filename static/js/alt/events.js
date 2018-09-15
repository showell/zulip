var alt_events = (function () {

var exports = {};

exports.handle = function (events) {
    _.each(events, function (event) {
        if (window.elm_bridge) {
            if (window.elm_bridge.handle_event(event)) {
                return;
            }
        }
        blueslip.log(event);
    });
};

return exports;

}());
window.alt_events = alt_events;
