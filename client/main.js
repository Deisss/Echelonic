(function () {
    var register = false;

    if (typeof UI !== 'undefined' && !register) {
        register = true;

        // Debug the scope and the given object in parameters
        UI.registerHelper('debug', function (val) {
            console.log('===== CONTEXT ======');
            console.log(this);

            if(typeof(val) !== 'undefined' && val !== null) {
                console.log('====== VALUE =======');
                console.log(val);
            }
        });

        // Markdown parser
        UI.registerHelper('markdown', function (text) {
            // We safe (remove < & > elements) and then parse markdown
            // This is because markdown does add HTML tags to it, so we need
            // to be sure they are safe...
            var safe      = $('<div>').text(text).html(),
                markdown  = new showdown.Converter(),
                converted = markdown.makeHtml(safe);

            // We remove <p>...</p>
            return converted.substring(3, converted.length - 4);
        });

        // Get the moment time, like "few seconds ago" style
        UI.registerHelper('momentNow', function (date) {
            return moment(date).fromNow();
        });

        // Find and get the user pretty print from it's id
        UI.registerHelper('prettyFindUser', function (id) {
            if (id === null || typeof(id) === 'undefined' || !id) {
                return '';
            }

            var user = Meteor.users.findOne(id);

            if (user === null || typeof(user) === 'undefined') {
                return '';
            }

            if (typeof(user) === 'string') {
                return user;
            } else if (user._id === Meteor.userId()) {
                return 'You';
            } else if (user.profile && user.profile.firstname && user.profile.lastname) {
                return user.profile.firstname + ' ' + user.profile.lastname;
            } else if (user.profile && user.profile.firstname) {
                return user.profile.firstname;
            } else if (user.profile && user.profile.lastname) {
                return user.profile.lastname;
            } else if (user.emails && user.emails[0].address) {
                return user.emails[0].address;
            } else if (user.email) {
                return user.email;
            } else {
                return '';
            }
        });

        // Same as prettyFindUser, but does not search in database...
        UI.registerHelper('prettyUser', function(user) {
            if (user === null || typeof(user) === 'undefined') {
                return '';
            }

            if (typeof(user) === 'string') {
                return user;
            } else if (user._id === Meteor.userId()) {
                return 'You';
            } else if (user.profile && user.profile.firstname && user.profile.lastname) {
                return user.profile.firstname + ' ' + user.profile.lastname;
            } else if (user.profile && user.profile.firstname) {
                return user.profile.firstname;
            } else if (user.profile && user.profile.lastname) {
                return user.profile.lastname;
            } else if (user.emails && user.emails[0].address) {
                return user.emails[0].address;
            } else if (user.email) {
                return user.email;
            } else {
                return '';
            }
        });

        // Get or find the best possible email look...
        UI.registerHelper('prettyEmail', function (user) {
            if (user === null || typeof(user) === 'undefined') {
                return '';
            }

            if (typeof(user) === 'string') {
                return user;
            } else if (user.emails && user.emails[0].address) {
                return user.emails[0].address;
            } else if (user.email) {
                return user.email;
            }
        });

        // Get or find the best md5 email version
        UI.registerHelper('md5PrettyEmail', function (user) {
            if (user === null || typeof(user) === 'undefined') {
                return md5('');
            }

            if (typeof(user) === 'string') {
                return md5(user);
            } else if (user.emails && user.emails[0].address) {
                return md5(user.emails[0].address);
            } else if (user.email) {
                return md5(user.email);
            } else {
                return md5('');
            }
        });
    }

    Template.flashMessages.events({
        'click .alert .link': function(e) {
            var target = $(e.target);

            if (target.attr('data-call')) {
                var params = [target.attr('data-call')],
                    counter = 1;

                while (target.attr('data-param' + counter)) {
                    params.push(target.attr('data-param' + counter));
                    counter++;
                }

                Meteor.call.apply(Meteor, params);

            } else if (target.attr('data-href')) {
                window.location.href = target.attr('data-href');
            }

            // In any cases, we clear
            FlashMessages.clear();
        }
    })
})();