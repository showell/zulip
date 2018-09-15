var elm_bridge = (function () {

var exports = {};

/*

    Some notes.

    *) This code is highly experimental.

*/

exports.initialize = function () {
    var humans = _.reject(page_params.realm_users, function (p) {
        return p.is_bot;
    });

    var person_list = _.map(humans, function (p) {
        return {
            user_id: p.user_id.toString(),
            email: p.email,
            name: p.full_name,
        };
    });

    var my_user_id = page_params.user_id.toString();

    exports.app = Elm.Elm.Main.init({
        node: document.getElementById('elm_app'),
        flags: {
            person_list: person_list,
            partner_id: my_user_id,
            my_user_id: my_user_id,
        },
    });

    exports.app.ports.wantToSend.subscribe(function (elm_data) {
        blueslip.log('in elm_bridge content = ', elm_data.content);
        blueslip.log('in elm_bridge partner_email = ', elm_data.partner_email);
        var data = {
            sender_id: page_params.user_id,
            queue_id: page_params.queue_id,
        };

        data.type = 'private';
        data.to = elm_data.partner_email;
        data.content = elm_data.content;

        channel.post({
            url: '/json/messages',
            data: data,
            success: function () {
                blueslip.log('success sending message');
            },
        });
    });
};

function target_id(message) {
    var recips = message.display_recipient;

    if (recips.length > 1) {
        recips = _.reject(message.display_recipient, function (r) {
            return r.id === message.sender_id;
        });
    }

    return recips[0].id.toString();
}

exports.handle_event = function (event) {
    switch (event.type) {
    case 'message':
        var message = event.message;

        if (message.type !== 'private') {
            return false;
        }

        var elm_data = {
            id: message.id,
            content: message.content,
            sender_id: message.sender_id.toString(),
            target_id: target_id(message),
        };

        exports.app.ports.newZulipMessage.send(elm_data);
        return true;
    }

    return false;
};

return exports;

}());
window.elm_bridge = elm_bridge;
