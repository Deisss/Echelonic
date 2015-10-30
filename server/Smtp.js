// Smtp configuration
// You need to install first meteor add email

Meteor.startup(function () {
    // Smtp data
    var username = '<youremail>@gmail.com',
        password = '<yourpassword>',
        server   = 'smtp.gmail.com',
        port     = 25;

    process.env.MAIL_URL= 'smtp://' + encodeURIComponent(username) + ':' +
            encodeURIComponent(password) + '@' + encodeURIComponent(server) +
            ':' + port;
});