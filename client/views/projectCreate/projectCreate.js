Template.projectCreate.onRendered(function () {
    $('.ui.dropdown').dropdown();

    // Drag/Drop feature
    $('.draggable').draggable({
        revert: 'invalid',
        cursor: 'move'
    });
    $('.droppable').droppable({
      drop: function(event, ui) {
        var drop = $(this),
            drag = ui.draggable;
        drag.detach().css({top: 0,left: 0}).appendTo(drop);
      }
    });
});

Template.projectCreate.helpers({
    md5: function(value) {
        return md5(value);
    },
    projects: function() {
        return Projects.find({}, {
            sort: [['category', 'asc'], ['search', 'asc']]
        });
    }
});

Template.projectCreate.events({
    // Cancel button
    'click .submit .cancel': function(e) {
        history.back();
    },
    /*
    ----------------------------
        USER INVITE
    ----------------------------
    */
    'click button.invite-user': function(e) {
        e.preventDefault();

        // Get email and test it's ok (not empty)
        var email = $('input.invite-user').val();
        if (!email) {
            $('#modal-empty-email').modal('show');
            return;
        }

        Meteor.call('inviteUser', email, function (error, result) {
            // 403: email already exist, fine so
            if (result && !error) {
                // Append
                UI.renderWithData(Template.userDraggable, {
                    _id: result._id,
                    email: email,
                    firstname: email,
                    lastname: ''
                }, $('#drop-waiting').get(0));

                // We clear
                $('input.invite-user').val('');

                // We mark the appended element as draggable
                $('a[data-id="' + result._id + '"].draggable').draggable({
                    revert: 'invalid',
                    cursor: 'move'
                });
            } else if (error.error === 403) {
                // There is a risk the user is already seeing the email,
                // we cannot accept that
                var els = $('a[data-email]'),
                    emails = [];

                // Selecting data-email of every elements
                els.each(function() {emails.push($(this).attr('data-email'));});

                // If the email already exist, we exit
                for (var i = 0, l = emails.length; i < l; ++i) {
                    if (emails[i] === email) {
                        $('#modal-exists-email').modal('show');
                        return;
                    }
                }

                // Email does not exist, we try to grab it
                Meteor.call('grabUser', email, function (error, result) {
                    if (result && !error) {
                        // Append
                        UI.renderWithData(Template.userDraggable, {
                            _id: result._id,
                            email: email,
                            firstname: email,
                            lastname: ''
                        }, $('#drop-waiting').get(0));

                        // We clear
                        $('input.invite-user').val('');

                        // We mark the appended element as draggable
                        $('a[data-id="' + result._id + '"].draggable').draggable({
                            revert: 'invalid',
                            cursor: 'move'
                        });
                    }
                })
            }
        });

        return false;
    },

    /*
    ----------------------------
        PROJECT CREATION
    ----------------------------
    */
    'click .submit .positive': function(e) {
        e.preventDefault();

        var root     = $('#projectCreate'),
            title    = root.find('input[name="title"]').val(),
            color    = root.find('#dropdown-color .text'),
            category = root.find('input[name="category"]').val();

        if (!title) {
            $('#modal-empty-title').modal('show');
            return;
        } else {
            title = jQuery.trim(title);
        }

        // Sanitize
        category = (!category) ? null : jQuery.trim(category);
        color = (!color.find('div').length > 0) ? null : jQuery.trim(color.text());

        // Now selecting allowed users
        var dropAdmins = root.find('#drop-admins').find('[data-id]'),
            dropUsers  = root.find('#drop-users').find('[data-id]'),
            users = [];

        dropAdmins.each(function () {
            var that = $(this);
            users.push({
                _id: that.attr('data-id'),
                email: that.attr('data-email'),
                isAdmin: true
            });
        });
        dropUsers.each(function () {
            var that = $(this);
            users.push({
                _id: that.attr('data-id'),
                email: that.attr('data-email'),
                isAdmin: false
            });
        });

        // We create element
        Meteor.call('addProject', color, title, category, users, function (error, result) {
            if (error) {
                alert(error);
            } else {
                Router.go('home');
            }
        });

        return false;
    }
});