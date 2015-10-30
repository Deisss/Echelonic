Template.accountSettings.events({
    // Add an email
    'click #accountSettings .addEmail': function() {
        var column = $('<div class="column">');
        $('#accountSettings .emailFields').append(column);
        UI.render(Template.userEmail, column.get(0));
    },
    // Change password
    'click #accountSettings .passwordUpdate': function(e) {
        var oldPassword = $('#accountSettings [name="oldPassword"]').val(),
            newPassword = $('#accountSettings [name="newPassword"]').val();

        Meteor.call('changePassword', oldPassword, newPassword,
                function (error, result) {
            if (error) {
                $('#modal-error-change-password').modal('show');
            } else if (result.passwordChanged === true) {
                $('#modal-success-change-password').modal('show');
            }
        });
    },
    // cancel account modification
    'click #accountSettings form .cancel': function(e) {
        e.preventDefault();
        history.back();
        return false;
    },
    // save account
    'click #accountSettings form .save': function(e) {
        e.preventDefault();

        var root       = $('#accountSettings'),
            firstname  = root.find('[name="firstname"]').val(),
            lastname   = root.find('[name="lastname"]').val(),
            emailsEl   = root.find('[name="email"]'),
            isVerified = false,
            emails     = [];

        emailsEl.each(function () {
            var that    = $(this),
                verif   = that.attr('data-verified'),
                content = that.val();

            if (content) {
                emails.push(content);
            }
            if (verif === true || verif === 'true') {
                isVerified = true;
            }
        });

        if (emails.length <= 0 || !isVerified) {
            $('#modal-error-no-email').modal('show');
            return;
        }

        Meteor.call('updateAccount', firstname, lastname, emails, function (error, result) {
            if (!error) {
                $('#modal-success-settings').modal('show');
                history.back();
            }
        });
        return false;
    }
});