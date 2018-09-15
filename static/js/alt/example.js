var example = (function () {

var exports = {};

exports.show_email = function () {
    var elem = document.getElementById('alt_app');

    elem.innerHTML = 'My email is ' + page_params.email;
    elem.innerHTML += '<hr>';
};

return exports;

}());
window.example = example;
