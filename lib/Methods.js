(function() {
    /**
     * Search for all projects related to user, or a single project.
     *
     * @param {Integer} userId              The user id to search related proj.
     * @param {Integer | Null} optionalId   A specific project id to search.
     * @param {Object | Null} optionalRest  Any restriction to append to
     *                                      data restriction.
     * @return {Array | Object}             A list of projects or a single
     *                                      project.
    */
    function searchProjects(userId, optionalId, optionalRest) {
        var user = Meteor.users.findOne(userId),
            emails = _.pluck(user.emails, 'address');

        // Building options
        var options = {
            deletedAt: null,
            $or: [
                {
                    ownerId: userId
                },
                {
                    users: {
                        $elemMatch: {
                            email: {
                                $in: emails
                            }
                        }
                    }
                }
            ]
        };

        var restrict = {
            createdAt: 0,
            updatedAt: 0,
            deletedAt: 0
        };

        if (optionalId) {
            options['_id'] = optionalId;
        }

        if (typeof(optionalRest) === 'object' && optionalRest !== null) {
            restrict = optionalRest;
        }

        return Projects.find(options, {
            fields: restrict
        });
    }

    /**
     * Get the user id currently in use.
     *
     * @return {String}                     The userId if any
    */
    function getUserId() {
        return (Meteor.isClient) ? Meteor.userId(): this.userId;
    }

    /**
     * Check if the user is logged in or not.
     * Throw an error if not and move to sign-in route.
     *
     * @return {String}                     The userId if any
    */
    function checkSignIn() {
        var userId = getUserId.call(this);
        if (!userId) {
            Router.go('/sign-in');
            throw new Meteor.Error('not-authorized');
        }
        return userId;
    }

    /**
     * Check if user is one of the project's administrator.
     * Throw an error if the user is not one of them...
     *
     * @param projectId {String}            The projectId to check
     * @param userId {String}               The userId to check
     * @return {Object}                     The project, if everything is fine
    */
    function isProjectAdmin(projectId, userId) {
        var project = Projects.findOne({
            _id: projectId
        });

        if (!project) {
            throw new Meteor.Error('not-existing');
        }

        // Restrict to admins only...
        var admins = _.filter(project.users, function (user) {
            return user.isAdmin;
        });
        var adminsIds = _.pluck(admins, '_id');
        if (project.ownerId !== userId || !_.contains(adminsIds, userId)) {
            throw new Meteor.Error('not-admin');
        }

        return project;
    }

    /**
     * Check if user is one of the project's users.
     * Throw an error if the user is not one of them...
     *
     * @param projectId {String}            The projectId to check
     * @param userId {String}               The userId to check
     * @return {Object}                     The project, if everything is fine
    */
    function isProjectUser(projectId, userId) {
        var project = Projects.findOne({
            _id: projectId
        });

        if (!project) {
            throw new Meteor.Error('not-existing');
        }

        var usersIds = _.pluck(project.users, '_id');
        if (project.ownerId !== userId && !_.contains(usersIds, userId)) {
            throw new Meteor.Error('not-user');
        }

        return project;
    }

    /**
     * Check if user is allowed to access/use current echelon.
     *
     * @param projectId {String}            The projectId to check
     * @param echelonId {String}            The echelonId to check
     * @param userId {String}               The userId to check
     * @return {Object}                     The echelon, if everything is fine
    */
    function isEchelonUser(projectId, echelonId, userId) {
        // TODO: in future release, be able to check here the user
        // is register as allowed for given echelon...

        var echelon = Echelons.findOne({
            _id: echelonId,
            projectId: projectId
        });

        if (!echelon) {
            throw new Meteor.Error('not-existing');
        }

        // TODO: here we should add futher check to be sure user
        // is OK for this echelon

        return echelon;
    }

    /**
     * Add activity or update existing activity of the given type, for every
     * specified users.
     *
     * @param projectId {String}            The related project
     * @param userId {String}               The user which create the activity
     * @param type {String}                 The activity type to check
     * @param usersIds {Array}              The list of users concerned by this
     *                                      activity change...
     * @param data {Object | Null}          Any revelant data, usually the
     *                                      routeName and routeParameters
    */
    function upsertActivity(projectId, userId, type, usersIds, data) {
        // Step 1: we get all activities
        var unseenActivity = null,
            unseenActivities = Activities.find({
            type: type,
            unseen: true,
            projectId: projectId,
            deletedAt: null
        }).fetch();

        var foundUsers      = _.pluck(unseenActivities, 'ownerId'),
            foundActivities = _.pluck(unseenActivities, '_id'),
            missingUsers    = _.difference(usersIds, foundUsers);

        var results = [];

        Activities.update({
            _id: {
                $in: foundActivities
            }
        }, {
            $push: {
                notifications: userId
            }
        });

        // Create the final object (extended from data)
        var edit = _.extend({
            type: type,
            icon: 'sitemap',
            unseen: true,
            notifications: [userId],
            ownerId: null,
            projectId: projectId
        }, data || {});

        // For every user which have nothing to see, we need to create
        for (var i = 0, l = missingUsers.length; i < l; ++i) {
            // In some case, the system may return [null] for missingUsers
            if (missingUsers[i] !== null) {
                (function (content, ownerId) {
                    content.ownerId = ownerId;
                    Activities.insert(edit);
                })(edit, missingUsers[i]);
            }
        }
    }

    /**
     * For every task related to the given echelon, we update the echelon
     * internal counter.
     *
     * @param echelonId {String}            The echelon id to update
    */
    function updateEchelonTasksStatistics(echelonId) {
        var tasksCursor = Tasks.find({
            echelonId: echelonId,
            deletedAt: null
        }, {
            fields: {
                _id: 1,
                doneAt: 1
            }
        });

        var counterTotal = tasksCursor.count(),
            tasks        = tasksCursor.fetch(),

            tasksDone    = _.filter(tasks, function (task) {
                var done = task.doneAt;
                return (typeof(done) !== 'undefined' && done !== null && done);
            }),
            tasksUnfinish= _.filter(tasks, function (task) {
                var done     = task.doneAt,
                    progress = task.progressAt;

                // The progress IS NOT defined => wrong
                if (typeof(progress) === 'undefined' || progress === null || !progress) {
                    return false;
                // Or the done IS defined => wrong
                } else if (typeof(done) !== 'undefined' && done !== null && done) {
                    return false;
                }
                return true;
            }),

            counterUnfinish = tasksUnfinish.length,
            counterDone     = tasksDone.length;

        var data = {
            total:    counterTotal,
            done:     counterDone,
            unfinish: counterUnfinish,
            progress: 0
        };

        if (counterTotal > 0) {
            data.progress = parseInt(counterDone / counterTotal * 100, 10);
        }

        Echelons.update({
            _id: echelonId
        }, {
            $set: {
                "statistics.tasks": data
            }
        });
    }


    Meteor.methods({
        // Add a new project
        addProject: function (color, title, category, users) {
            var userId = checkSignIn.call(this);

            title = title || '';

            var projectId = Projects.insert({
                color: color || null,
                title: title,
                search: title.toLowerCase(),
                category: category || null,
                users: users,
                ownerId: userId
            });

            var endId = Echelons.insert({
                title: 'E',
                top: 200,
                left: 800,
                links: [],
                isBegin: false,
                isEnd: true,
                ownerId: userId,
                projectId: projectId,
                beginAt: moment().add(3, 'month').toDate(),
                endAt: moment().add(3, 'month').toDate()
            });
            var middleId = Echelons.insert({
                title: 'Welcome',
                top: 190,
                left: 500,
                links: [endId],
                isBegin: false,
                isEnd: false,
                ownerId: userId,
                projectId: projectId,
                beginAt: new Date(),
                endAt: moment().add(3, 'month').toDate()
            });
            var beginId = Echelons.insert({
                title: 'B',
                top: 200,
                left: 200,
                links: [middleId],
                isBegin: true,
                isEnd: false,
                ownerId: userId,
                projectId: projectId,
                beginAt: new Date(),
                endAt: new Date()
            });

            return [projectId, beginId, middleId, endId];
        },

        // Edit an existing project (only OK by owner)
        editProject: function (id, icon, title, users) {
            var userId = checkSignIn.call(this);

            title = title || '';

            return Projects.update({
                _id: id,
                ownerId: userId
            }, {
                $set: {
                    icon: icon || 'user',
                    title: title,
                    search: title.toLowerCase(),
                    users: users
                }
            });
        },

        // Deleting the project (only OK by owner)
        deleteProject: function (id) {
            var userId = checkSignIn.call(this);

            return Projects.update({
                _id: id,
                ownerId: userId,
            }, {
                $set: {
                    deletedAt: new Date()
                }
            });
        },

        // Undeleting the project (only available for 24H)
        undeleteProject: function (id) {
            var userId = checkSignIn.call(this);

            return Projects.update({
                _id: id,
                ownerId: userId,
                // DeletedAt is not more than 24h
                deletedAt: {
                    $gt: moment().subtract(1, 'days').toDate()
                }
            }, {
                $set: {
                    deletedAt: null
                }
            });
        },

        addMessage: function(projectId, message) {
            var userId = checkSignIn.call(this),
                project = isProjectUser(projectId, userId);

            return Messages.insert({
                message: message,
                ownerId: userId,
                projectId: project._id,
                // Everybody in the project except the poster himself
                unseenUsers: _.without(_.pluck(project.users, '_id'), userId), 
                isGlobal: true
            });
        },

        // Mark as seen many messages
        seenMessages: function(projectId, messagesIds) {
            var userId = checkSignIn.call(this),
                project = isProjectUser(projectId, userId);

            return Messages.update({
                _id: {
                    $in: messagesIds
                },
                userId: userId,
                projectId: project._id
            }, {
                $pull: {
                    unseenUsers: userId
                }
            }, {
                multi: true
            });
        },

        // Mark as seen many activities
        seenActivities: function(projectId, activitiesIds) {
            var userId = checkSignIn.call(this),
                project = isProjectUser(projectId, userId);

            var now = new Date();

            return Activities.update({
                _id: {
                    $in: activitiesIds
                },
                projectId: project._id
            }, {
                $set: {
                    seenAt: now,
                    unseen: false
                }
            }, {
                // In this case, we don't want updatedAt to change...
                getAutoValues: false,
                multi: true
            });
        },

        addEchelon: function(projectId, top, left, title, description) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            // For every user except the adding one, we create a new
            // activity entry
            var concernedUsers = _.without(_.pluck(project.users, '_id'), userId);

            // We add many activities to relate this change
            upsertActivity(project._id, userId, 'addEchelon', concernedUsers, {
                icon: 'sitemap',
                routeName: 'projectEchelon',
                routeParameters: {
                    _id: project._id
                }
            });

            return Echelons.insert({
                title: title,
                description: description || '',
                top: top,
                left: left,
                links: [],
                isBegin: false,
                isEnd: false,
                ownerId: userId,
                projectId: project._id
            });
        },

        moveEchelon: function(projectId, echelonId, top, left) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            return Echelons.update({
                _id: echelonId,
                projectId: project._id,
                deletedAt: null,
            }, {
                $set: {
                    top: top,
                    left: left
                }
            });
        },

        editEchelon: function(projectId, echelonId, title, description, beginAt, endAt) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            // For every user except the adding one, we create a new
            // activity entry
            var concernedUsers = _.without(_.pluck(project.users, '_id'), userId);
            upsertActivity(project._id, userId, 'editEchelon', concernedUsers, {
                icon: 'sitemap',
                routeName: 'projectEchelon',
                routeParameters: {
                    _id: project._id
                }
            });

            var updater = {
                title: title,
                description: description || ''
            };

            if (beginAt && moment(beginAt).isValid()) {
                updater.beginAt = beginAt;
            }
            if (endAt && moment(endAt).isValid()) {
                updater.endAt = endAt;
            }

            return Echelons.update({
                _id: echelonId,
                projectId: project._id,
                deletedAt: null
            }, {
                $set: updater
            });
        },

        deleteEchelon: function(projectId, echelonId) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            // For every user except the adding one, we create a new
            // activity entry
            var concernedUsers = _.without(_.pluck(project.users, '_id'), userId);
            upsertActivity(project._id, userId, 'deleteEchelon', concernedUsers, {
                icon: 'sitemap',
                routeName: 'projectEchelon',
                routeParameters: {
                    _id: project._id
                }
            });

            return Echelons.update({
                _id: echelonId,
                isBegin: false,
                isEnd: false,
                projectId: project._id
            }, {
                $set: {
                    deletedAt: new Date()
                }
            });
        },

        undeleteEchelon: function(projectId, echelonId) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            return Echelons.update({
                _id: echelonId,
                projectId: project._id,
                deletedAt: {
                    $gt: moment().subtract(1, 'days').toDate()
                }
            }, {
                $set: {
                    deletedAt: null
                }
            });
        },

        addConnector: function(projectId, sourceId, targetId) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            // TODO: check there is no cycling reference here using Toposort

            return Echelons.update({
                _id: sourceId,
                projectId: project._id
            }, {
                $push: {
                    links: targetId
                }
            });
        },

        moveConnector: function(projectId, oldSourceId, oldTargetId, newSourceId, newTargetId) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            // TODO: check there is no cycling reference here using Toposort

            // We remove from one, and add to another...
            return [
                Echelons.update({
                    _id: oldSourceId,
                    projectId: project._id,
                    deletedAt: null
                }, {
                    $pull: {
                        links: oldTargetId
                    }
                }),
                Echelons.update({
                    _id: newSourceId,
                    projectId: project._id,
                    deletedAt: null
                }, {
                    $push: {
                        links: newTargetId
                    }
                })
            ];

        },

        deleteConnector: function(projectId, sourceId, targetId) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId);

            return Echelons.update({
                _id: sourceId,
                projectId: project._id,
            }, {
                $pull: {
                    links: targetId
                }
            });
        },

        addTask: function(projectId, echelonId, assignId, title, description, priority, dueAt) {
            var userId = checkSignIn.call(this),
                project = isProjectAdmin(projectId, userId),
                echelon = isEchelonUser(projectId, echelonId, userId);

            // The task is strictly binded to an echelon, so the type vary
            upsertActivity(project._id, userId, 'addTask:' + echelon._id, [assignId], {
                icon: 'tasks',
                routeName: 'echelonOverview',
                routeParameters: {
                    _id: project._id,
                    _eid: echelon._id
                }
            });

            var cursor = Tasks.insert({
                title: title,
                description: description || '',
                priority: priority || 0, // Priority 0: none
                assignId: assignId || null,
                ownerId: userId,
                echelonId: echelon._id,
                projectId: project._id,
                dueAt: dueAt || null
            });

            // Update the statistics (always AFTER inserting)
            updateEchelonTasksStatistics(echelonId);

            return cursor;
        },

        addComment: function(projectId, echelonId, resourceId, type, comment, referId) {
            var userId = checkSignIn.call(this),
                project = isProjectUser(projectId, userId),
                echelon = isEchelonUser(projectId, echelonId, userId);

            // For every user except the adding one, we create a new
            // activity entry
            var concernedUsers  = _.without(_.pluck(project.users, '_id'), userId);
            var firstLetterType = type.charAt(0).toUpperCase() + type.slice(1);


            var routeParameters = {
                _id: project._id,
                _eid: echelon._id
            };

            if (type === 'task') {
                routeParameters._tid = resourceId;
            } else {
                console.error('addComment: Unable to understand the type "' + type + '"');
            }

            // The task is strictly binded to an echelon, so the type vary
            upsertActivity(project._id, userId, 'add' + firstLetterType + 'Comment:' + resourceId, concernedUsers, {
                icon: 'tasks',
                routeName: type + 'See',
                routeParameters: routeParameters
            });

            var query = {
                comment: comment,
                likes: [],
                dislikes: [],
                referId: referId || null,
                ownerId: userId,
                projectId: project._id,
                echelonId: echelon._id
            };

            if (type === 'task') {
                query.taskId = resourceId;
            }

            return Comments.insert(query);
        },

        likeComment: function(projectId, echelonId, resourceId, type, commentId) {
            var userId  = checkSignIn.call(this),
                project = isProjectUser(projectId, userId),
                echelon = isEchelonUser(projectId, echelonId, userId);

            // For every user except the adding one, we create a new
            // activity entry
            var concernedUsers  = _.without(_.pluck(project.users, '_id'), userId);
            var firstLetterType = type.charAt(0).toUpperCase() + type.slice(1);

            var routeParameters = {
                _id: project._id,
                _eid: echelon._id
            };

            if (type === 'task') {
                routeParameters._tid = resourceId;
            } else {
                console.error('addComment: Unable to understand the type "' + type + '"');
            }

            // The task is strictly binded to an echelon, so the type vary
            upsertActivity(project._id, userId, 'like' + firstLetterType + 'Comment:' + resourceId, concernedUsers, {
                icon: 'tasks',
                routeName: type + 'See',
                routeParameters: routeParameters
            });

            return Comments.update({
                _id: commentId,
                projectId: project._id,
                echelonId: echelon._id
            }, {
                $addToSet: {
                    likes: userId
                },
                $pull: {
                    dislikes: userId
                }
            })
        },

        dislikeComment: function(projectId, echelonId, resourceId, type, commentId) {
            var userId  = checkSignIn.call(this),
                project = isProjectUser(projectId, userId),
                echelon = isEchelonUser(projectId, echelonId, userId);

            // For every user except the adding one, we create a new
            // activity entry
            var concernedUsers  = _.without(_.pluck(project.users, '_id'), userId);
            var firstLetterType = type.charAt(0).toUpperCase() + type.slice(1);

            var routeParameters = {
                _id: project._id,
                _eid: echelon._id
            };

            if (type === 'task') {
                routeParameters._tid = resourceId;
            } else {
                console.error('addComment: Unable to understand the type "' + type + '"');
            }

            // The task is strictly binded to an echelon, so the type vary
            upsertActivity(project._id, userId, 'dislike' + firstLetterType + 'Comment:' + resourceId, concernedUsers, {
                icon: 'tasks',
                routeName: type + 'See',
                routeParameters: routeParameters
            });

            return Comments.update({
                _id: commentId,
                projectId: project._id,
                echelonId: echelon._id
            }, {
                $addToSet: {
                    dislikes: userId
                },
                $pull: {
                    likes: userId
                }
            });
        },


        updateAccount: function(firstname, lastname, emails) {
            var userId = checkSignIn.call(this),
                user = Meteor.users.findOne(userId);

            if (!user) {
                throw new Meteor.Error('not-linked');
            }

            var originalEmails = user.emails,
                email          = null,
                existingEmails = _.pluck(originalEmails, 'address'),
                resultEmails   = [];

            var i = emails.length;
            while (i--) {
                email = emails[i].toLowerCase();

                var verified = false;
                if (_.contains(existingEmails, email)) {
                    for (var j = 0, k = originalEmails.length; j < k; ++j) {
                        if (originalEmails[j].address === email) {
                            verified = originalEmails[j].verified;
                            break;
                        }
                    }

                // The email is not in the current existing email list
                // so we search for it...
                } else {
                    var tmpUser = Meteor.users.findOne({
                        email: email
                    });

                    // Error... The email should not be listed
                    if (tmpUser) {
                        emails.slice(i, 1);
                    }
                }

                resultEmails.push({
                    address: email,
                    verified: verified
                });
            }

            return Meteor.users.update(user._id, {
                $set: {
                    profile: {
                        firstname: firstname,
                        lastname: lastname,
                    },
                    emails: resultEmails
                }
            })
        }
    });

    if (Meteor.isServer) {
        Meteor.methods({
            signout: function() {
                var callerId = checkSignIn.call(this);

                return Meteor.users.update({
                    '_id': callerId
                }, {
                    $set : {
                        'services.resume.loginTokens' : []
                    }
                });
            },

            // Invite a user (if it's not existing yet)
            inviteUser: function (email) {
                var callerId = checkSignIn.call(this);

                // The system will automatically check for us
                // user email already exist or not
                var userId = Accounts.createUser({
                    email: email
                });

                // Sending a "hey join us"
                Accounts.sendEnrollmentEmail(userId);

                return Meteor.users.findOne({
                    '_id': userId
                });
            },

            // Same as invite, except user is already register in our app.
            // TODO: secure A LOT this function, like a max call of 30 calls per
            // minute should be quite OK
            grabUser: function (email) {
                var callerId = checkSignIn.call(this);

                return Meteor.users.findOne({
                    emails: {
                        $elemMatch: {
                            address: email
                        }
                    }
                });
            }
        });
    }

})();