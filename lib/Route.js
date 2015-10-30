Router.configure({
    loadingTemplate: 'loading',
    notFoundTemplate: 'basicNotFound'
});

Router.map(function () {
    // Subscription manager
    var subs = new SubsManager({
        // maximum number of cache subscriptions
        cacheLimit: 20,
        // any subscription will be expire after 5 minutes,
        // if it's not subscribed again
        expireIn: 5
    });

    function baseSEO(value, callback) {
        var orig = value;
        return function() {
            value = orig;
            if (!Meteor.isClient) {
                return;
            }
            if (callback) {
                try {
                    value += callback.call(this);
                } catch (e) {}
            }
            SEO.set({
                title: value
            });
        };
    }

    // Home
    this.route('home', {
        path: '/',
        action: function () {
            subs.subscribe('user');
            subs.subscribe('projects');
            this.render();
        },
        onAfterAction: baseSEO('Echelonic | Welcome')
    });

    // Account details/edit
    this.route('accountSettings', {
        path: '/account/settings',
        data: function () {
            return {
                user: Meteor.users.findOne({
                    _id: Meteor.userId()
                })
            };
        },
        action: function () {
            subs.subscribe('user');
            subs.subscribe('projects');
            this.render();
        },
        onAfterAction: baseSEO('Echelonic | My Account')
    });

    // Create a project
    this.route('projectCreate', {
        path: '/project/create',
        waitOn: function () {
            return [
                IRLibLoader.load('/js/jquery-ui.min.js'),
                IRLibLoader.load('/js/jquery.ui.touch-punch.min.js')
            ];
        },
        action: function () {
            subs.subscribe('user');
            Meteor.subscribe('globalUsers');
            subs.subscribe('projects');
            this.render();
        },
        onAfterAction: baseSEO('Echelonic | New project')
    });

    // Edit a list
    this.route('projectEdit', {
        path: '/project/:_id/edit',
        waitOn: function () {
            return [
                IRLibLoader.load('/js/jquery-ui.min.js'),
                IRLibLoader.load('/js/jquery.ui.touch-punch.min.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');
            Meteor.subscribe('globalUsers');
            subs.subscribe('projectUsers', this.params._id);
            subs.subscribe('projects');
            subs.subscribe('project', this.params._id);
            this.render();
        },
        onAfterAction: baseSEO('Echelonic | Edit ', function () {
            return this.data().project.title;
        })
    });

    // See a project (in the 'home' panel)
    this.route('projectOverview', {
        path: '/project/:_id/overview',
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');
            subs.subscribe('project', this.params._id);
            subs.subscribe('projects');
            subs.subscribe('projectUsers', this.params._id);
            subs.subscribe('projectActivities', this.params._id);
            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });

    this.route('projectEchelon', {
        path: '/project/:_id/echelon',
        waitOn: function () {
            return [
                IRLibLoader.load('/js/dom.jsPlumb-1.7.7-min.js'),
                IRLibLoader.load('/css/pikaday.css'),
                IRLibLoader.load('/js/pikaday.js'),
                IRLibLoader.load('/js/Echelons.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');

            // Project related
            subs.subscribe('project', this.params._id);
            subs.subscribe('projectUsers', this.params._id);

            // Chat related
            subs.subscribe('projectMessages', this.params._id);
            subs.subscribe('projectUnseenMessages', this.params._id);

            // Activity related
            subs.subscribe('projectActivities', this.params._id);
            subs.subscribe('projectUnseenActivities', this.params._id);

            // Echelons related
            subs.subscribe('projectEchelons', this.params._id);

            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });

    this.route('echelonOverview', {
        path: '/project/:_id/echelon/:_eid/overview',
        waitOn: function () {
            return [
                IRLibLoader.load('/css/pikaday.css'),
                IRLibLoader.load('/js/pikaday.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                }),
                echelon: Echelons.findOne({
                    _id: this.params._eid,
                    projectId: this.params._id,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');

            // Project related
            subs.subscribe('project', this.params._id);
            subs.subscribe('projectUsers', this.params._id);

            // Chat related
            subs.subscribe('projectMessages', this.params._id);
            subs.subscribe('projectUnseenMessages', this.params._id);

            // Activity related
            subs.subscribe('projectActivities', this.params._id);
            subs.subscribe('projectUnseenActivities', this.params._id);

            // Echelon related
            subs.subscribe('projectEchelon', this.params._id, this.params._eid);
            subs.subscribe('echelonTasks', this.params._id, this.params._eid);

            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });

    this.route('tasksOverview', {
        path: '/project/:_id/echelon/:_eid/tasks/overview',
        waitOn: function () {
            return [
                IRLibLoader.load('/css/pikaday.css'),
                IRLibLoader.load('/js/pikaday.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                }),
                echelon: Echelons.findOne({
                    _id: this.params._eid,
                    projectId: this.params._id,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');

            // Project related
            subs.subscribe('project', this.params._id);
            subs.subscribe('projectUsers', this.params._id);

            // Chat related
            subs.subscribe('projectMessages', this.params._id);
            subs.subscribe('projectUnseenMessages', this.params._id);

            // Activity related
            subs.subscribe('projectActivities', this.params._id);
            subs.subscribe('projectUnseenActivities', this.params._id);

            // Echelon related
            subs.subscribe('projectEchelon', this.params._id, this.params._eid);
            subs.subscribe('echelonTasks', this.params._id, this.params._eid);

            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });

    this.route('taskSee', {
        path: '/project/:_id/echelon/:_eid/tasks/:_tid',
        waitOn: function () {
            return [
                IRLibLoader.load('/css/pikaday.css'),
                IRLibLoader.load('/js/pikaday.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                }),
                echelon: Echelons.findOne({
                    _id: this.params._eid,
                    projectId: this.params._id,
                    deletedAt: null
                }),
                task: Tasks.findOne({
                    _id: this.params._tid,
                    projectId: this.params._id,
                    echelonId: this.params._eid,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');

            // Project related
            subs.subscribe('project', this.params._id);
            subs.subscribe('projectUsers', this.params._id);

            // Chat related
            subs.subscribe('projectMessages', this.params._id);
            subs.subscribe('projectUnseenMessages', this.params._id);

            // Activity related
            subs.subscribe('projectActivities', this.params._id);
            subs.subscribe('projectUnseenActivities', this.params._id);

            // Echelon related
            subs.subscribe('projectEchelon', this.params._id, this.params._eid);
            subs.subscribe('echelonTasks', this.params._id, this.params._eid);

            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });

    this.route('taskEdit', {
        path: '/project/:_id/echelon/:_eid/tasks/:_tid/edit',
        waitOn: function () {
            return [
                IRLibLoader.load('/css/pikaday.css'),
                IRLibLoader.load('/js/pikaday.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                }),
                echelon: Echelons.findOne({
                    _id: this.params._eid,
                    projectId: this.params._id,
                    deletedAt: null
                }),
                task: Tasks.findOne({
                    _id: this.params._tid,
                    projectId: this.params._id,
                    echelonId: this.params._eid,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');

            // Project related
            subs.subscribe('project', this.params._id);
            subs.subscribe('projectUsers', this.params._id);

            // Chat related
            subs.subscribe('projectMessages', this.params._id);
            subs.subscribe('projectUnseenMessages', this.params._id);

            // Activity related
            subs.subscribe('projectActivities', this.params._id);
            subs.subscribe('projectUnseenActivities', this.params._id);

            // Echelon related
            subs.subscribe('projectEchelon', this.params._id, this.params._eid);
            subs.subscribe('echelonTasks', this.params._id, this.params._eid);

            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });

    this.route('pollsOverview', {
        path: '/project/:_id/echelon/:_eid/polls/overview',
        waitOn: function () {
            return [
                IRLibLoader.load('/css/pikaday.css'),
                IRLibLoader.load('/js/pikaday.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                }),
                echelon: Echelons.findOne({
                    _id: this.params._eid,
                    projectId: this.params._id,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');

            // Project related
            subs.subscribe('project', this.params._id);
            subs.subscribe('projectUsers', this.params._id);

            // Chat related
            subs.subscribe('projectMessages', this.params._id);
            subs.subscribe('projectUnseenMessages', this.params._id);

            // Activity related
            subs.subscribe('projectActivities', this.params._id);
            subs.subscribe('projectUnseenActivities', this.params._id);

            // Echelon related
            subs.subscribe('projectEchelon', this.params._id, this.params._eid);

            // TODO: bind polls
            //subs.subscribe('echelonTasks', this.params._id, this.params._eid);

            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });

    this.route('filesOverview', {
        path: '/project/:_id/echelon/:_eid/files/overview',
        waitOn: function () {
            return [
                IRLibLoader.load('/css/pikaday.css'),
                IRLibLoader.load('/js/pikaday.js')
            ];
        },
        data: function () {
            return {
                project: Projects.findOne({
                    _id: this.params._id,
                    deletedAt: null
                }),
                echelon: Echelons.findOne({
                    _id: this.params._eid,
                    projectId: this.params._id,
                    deletedAt: null
                })
            };
        },
        action: function () {
            subs.subscribe('user');

            // Project related
            subs.subscribe('project', this.params._id);
            subs.subscribe('projectUsers', this.params._id);

            // Chat related
            subs.subscribe('projectMessages', this.params._id);
            subs.subscribe('projectUnseenMessages', this.params._id);

            // Activity related
            subs.subscribe('projectActivities', this.params._id);
            subs.subscribe('projectUnseenActivities', this.params._id);

            // Echelon related
            subs.subscribe('projectEchelon', this.params._id, this.params._eid);

            // TODO: bind files
            //subs.subscribe('echelonTasks', this.params._id, this.params._eid);

            this.render();
        },
        onAfterAction: baseSEO('Echelonic | ', function () {
            return this.data().project.title;
        })
    });
});



// Options
AccountsTemplates.configure({
    //defaultLayout: 'emptyLayout',
    showForgotPasswordLink: true,
    overrideLoginErrors: true,
    enablePasswordChange: true,
    sendVerificationEmail: true,
    enforceEmailVerification: true,

    //confirmPassword: true,
    //continuousValidation: false,
    //displayFormLabels: true,
    //forbidClientAccountCreation: false,
    //formValidationFeedback: true,
    //homeRoutePath: '/',
    //showAddRemoveServices: false,
    //showPlaceholders: true,

    negativeValidation: true,
    positiveValidation:true,
    negativeFeedback: false,
    positiveFeedback:true,

    // Privacy Policy and Terms of Use
    //privacyUrl: 'privacy',
    //termsUrl: 'terms-of-use',
});

// Routes
AccountsTemplates.configureRoute('changePwd');
AccountsTemplates.configureRoute('enrollAccount');
AccountsTemplates.configureRoute('forgotPwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('signIn');
AccountsTemplates.configureRoute('signUp');
AccountsTemplates.configureRoute('verifyEmail');






// All routes are private
Router.plugin('ensureSignedIn');