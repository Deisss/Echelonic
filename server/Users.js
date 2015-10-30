// User management

// On account creation, we send a mail
/*Accounts.onCreateUser(function (options, user) {
    user.profile = {};

    // Sending an email
    Meteor.setTimeout(function () {
        Accounts.sendVerificationEmail(user._id);
    }, 2000);

    return user;
});*/

// If user try to logon with an email not verified
Accounts.validateLoginAttempt(function (attempt) {
    if (attempt.user) {
        // no email linked to account
        if (!attempt.user.emails) {
            return false;
        }

        for (var i = 0, l = attempt.user.emails.length; i < l; ++i) {
            if (attempt.user.emails[i].verified === true) {
                return true;
            }
        }

        // No email validate requirement, we exit
        return false;
    }
    return true;
});

// Email template
Meteor.startup(function () {
    // The sender
    Accounts.emailTemplates.from = 'Meteor Password <no-reply@meteor-password.com>';

    // The public name of application
    Accounts.emailTemplates.siteName = 'Meteor Password';

    // A Function that takes a user object and returns a String for the subject line of the email.
    Accounts.emailTemplates.verifyEmail.subject = function(user) {
        return 'Confirm Your Email Address';
    };

    // A Function that takes a user object and a url, and returns the body text for the email.
    // Note: if you need to return HTML instead, use Accounts.emailTemplates.verifyEmail.html
    Accounts.emailTemplates.verifyEmail.text = function(user, url) {
        return 'click on the following link to verify your email address: ' + url;
    };
});