// This file creates everything needed of first run.
// Note: first run is caracterised by: no user + no project

(function() {
    var countUser = Meteor.users.find().count(),
        countProj = Projects.find().count();


    // We create the mock elements to apply tests
    if (!countUser && !countProj) {
        /*
         * -------------------------
         *   MOCK USERS
         * -------------------------
        */
        Meteor.users.insert({
            _id: 'qFMpgQSsTjPb9n3Tx',
            emails: [{
                address: 'test@hotmail.fr',
                verified: true
            }],
            services: {
                password: {
                    bcrypt: '<yourpassword bcrypted>'
                }
            }
        });

        Meteor.users.insert({
            _id: 'Ys5FwC53uMT6QuYyf',
            emails: [{
                address: 'test@gmail.com',
                verified: true
            }],
            services: {
                password: {
                    bcrypt: "<yourpassword bcrypted>"
                }
            }
        });

        /*
         * -------------------------
         *   MOCK PROJECTS
         * -------------------------
        */
        Projects.insert({
            _id: 'PeDdN4t4trS3fdReN',
            title: 'Colorless project',
            search: 'colorless project',
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            users: [{
                _id: 'qFMpgQSsTjPb9n3Tx',
                email: 'test@hotmail.fr',
                isAdmin: true
            }],
            beginAt: new Date(),
            endAt: moment().add(3, 'month').toDate()
        });
        Projects.insert({
            _id: 'g9j7yiwEcyiqJZdaa',
            color: 'red',
            title: 'Projet partagé avec un user et un admin',
            search: 'projet partagé avec un user et un admin',
            category: 'Catégorie 1',
            ownerId: 'Ys5FwC53uMT6QuYyf',
            users: [{
                _id: 'Ys5FwC53uMT6QuYyf',
                email: 'test@gmail.com',
                isAdmin: true
            }, {
                _id: 'qFMpgQSsTjPb9n3Tx',
                email: 'test@hotmail.fr',
                isAdmin: false
            }]
        });
        Projects.insert({
            _id: 'foAG5BSnLvS4aJXZm',
            color: 'teal',
            title: 'un autre projet',
            search: 'un autre projet',
            category: 'Catégorie 1',
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            users: [{
                _id: 'qFMpgQSsTjPb9n3Tx',
                email: 'test@hotmail.fr',
                isAdmin: true
            }, {
                _id: 'Ys5FwC53uMT6QuYyf',
                email: 'test@gmail.com',
                isAdmin: false
            }]
        });

        /*
         * -------------------------
         *   MOCK ECHELONS
         * -------------------------
        */
        Echelons.insert({
            _id: 'BtKP6AJWzkAhMF8DR',
            title: 'B',
            top: 200,
            left: 200,
            links: ['nsf5LX9kjfGmsogDS'],
            isBegin: true,
            isEnd: false,
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            projectId: 'PeDdN4t4trS3fdReN',
            beginAt: new Date(),
            endAt: new Date()
        });
        Echelons.insert({
            _id: 'nsf5LX9kjfGmsogDS',
            title: 'Welcome',
            top: 190,
            left: 500,
            links: ['tsDJgusbzgnqtyJGQ'],
            isBegin: false,
            isEnd: false,
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            projectId: 'PeDdN4t4trS3fdReN',
            beginAt: new Date(),
            endAt: moment().add(3, 'month').toDate()
        });
        Echelons.insert({
            _id: 'tsDJgusbzgnqtyJGQ',
            title: 'E',
            top: 200,
            left: 800,
            links: [],
            isBegin: false,
            isEnd: true,
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            projectId: 'PeDdN4t4trS3fdReN',
            beginAt: moment().add(3, 'month').toDate(),
            endAt: moment().add(3, 'month').toDate()
        });

        Echelons.insert({
            _id: 'HugdQLEqb7QLM56M6',
            title: 'B',
            top: 200,
            left: 200,
            links: ['K7bXbTYZMBwK7rmFS'],
            isBegin: true,
            isEnd: false,
            ownerId: 'Ys5FwC53uMT6QuYyf',
            projectId: 'g9j7yiwEcyiqJZdaa',
            beginAt: moment().add(2, 'month').toDate(),
            endAt: moment().add(5, 'month').toDate()
        });
        Echelons.insert({
            _id: 'K7bXbTYZMBwK7rmFS',
            title: 'Welcome',
            top: 190,
            left: 500,
            links: ['Zqxr8AumiNuRRtMGu'],
            isBegin: false,
            isEnd: false,
            ownerId: 'Ys5FwC53uMT6QuYyf',
            projectId: 'g9j7yiwEcyiqJZdaa',
            beginAt: moment().add(2, 'month').toDate(),
            endAt: moment().add(5, 'month').toDate()
        });
        Echelons.insert({
            _id: 'Zqxr8AumiNuRRtMGu',
            title: 'E',
            top: 200,
            left: 800,
            links: [],
            isBegin: false,
            isEnd: true,
            ownerId: 'Ys5FwC53uMT6QuYyf',
            projectId: 'g9j7yiwEcyiqJZdaa',
            beginAt: moment().add(2, 'month').toDate(),
            endAt: moment().add(5, 'month').toDate()
        });

        Echelons.insert({
            _id: 'wdxgy7rTpQxzgqGgM',
            title: 'B',
            top: 200,
            left: 200,
            links: ['7aJjcromCcabvyCyn'],
            isBegin: true,
            isEnd: false,
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            projectId: 'foAG5BSnLvS4aJXZm',
            beginAt: moment().subtract(2, 'year').toDate(),
            endAt: moment().subtract(2, 'year').toDate()
        });
        Echelons.insert({
            _id: '7aJjcromCcabvyCyn',
            title: 'Welcome',
            top: 190,
            left: 500,
            links: ['Q3ECGjrpBunZZgSjh'],
            isBegin: false,
            isEnd: false,
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            projectId: 'foAG5BSnLvS4aJXZm',
            beginAt: moment().subtract(2, 'year').toDate(),
            endAt: moment().subtract(18, 'month').toDate()
        });
        Echelons.insert({
            _id: 'Q3ECGjrpBunZZgSjh',
            title: 'E',
            top: 200,
            left: 800,
            links: [],
            isBegin: false,
            isEnd: true,
            ownerId: 'qFMpgQSsTjPb9n3Tx',
            projectId: 'foAG5BSnLvS4aJXZm',
            beginAt: moment().subtract(18, 'month').toDate(),
            endAt: moment().subtract(18, 'month').toDate()
        });


        /*
         * -------------------------
         *   MOCK MESSAGES
         * -------------------------
        */
        // First project
        for (var i = 0; i < 5000; ++i) {
            Messages.insert({
                message: 'test ' + (i + 1),
                ownerId: 'qFMpgQSsTjPb9n3Tx',
                projectId: 'PeDdN4t4trS3fdReN',
                // One message out of 3 is unseen
                unseenUsers: (i % 3 !== 0) ? [] : ['qFMpgQSsTjPb9n3Tx'],
                isGlobal: true
            });
        }
        // Second project
        for (var i = 0; i < 5000; ++i) {
            Messages.insert({
                message: 'test ' + (i + 1),
                ownerId: (i % 2 === 0) ? 'qFMpgQSsTjPb9n3Tx': 'Ys5FwC53uMT6QuYyf',
                projectId: 'g9j7yiwEcyiqJZdaa',
                // One message out of 3 is unseen
                unseenUsers: (i % 3 !== 0) ? [] : ['qFMpgQSsTjPb9n3Tx', 'Ys5FwC53uMT6QuYyf'],
                isGlobal: true
            });
        }
        // Last project
        for (var i = 0; i < 5000; ++i) {
            Messages.insert({
                message: 'test ' + (i + 1),
                ownerId: (i % 2 === 0) ? 'qFMpgQSsTjPb9n3Tx': 'Ys5FwC53uMT6QuYyf',
                projectId: 'foAG5BSnLvS4aJXZm',
                // One message out of 3 is unseen
                unseenUsers: (i % 3 !== 0) ? [] : ['qFMpgQSsTjPb9n3Tx', 'Ys5FwC53uMT6QuYyf'],
                isGlobal: true
            });
        }
    }
})();