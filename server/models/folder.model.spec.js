'use strict';

var should = require('should'),
    assert = require('assert'),
    models = require('./index'),
    User = models.User,
    Folder = models.Folder,
    FolderItem = models.FolderItem;

describe('Folder Model Unit Tests', function() {
    var testUser = 'testuserfolder';

    before(function (done) {
        return User.sync()
        .then(function() {
            return Folder.sync();
        })
        .then(function() {
            return FolderItem.sync();
        })
        .then(function () {
            return models.User.destroy( {
                where: {username: testUser}
            });
        })
        .then(function () {
            return User.create({
                username: testUser
            });
        })
        .then(function(user) {
            return Folder.create({
                name: 'ROOT',
                parentId: null,
                hierarchyLevel: 1
            })
            .then(function(folder) {
                return user.setRootFolder(folder);
            })
        })
        .then(function() {
            done();
        })
        .catch (function(err) {
            done(err);
        });
    });

    it('should find ROOT folder for testuserfolder', function(done) {
        return User.find({where: {username: testUser}})
        .then(function (user) {
            return user.getRootFolder();
        })
        .then(function(folder) {
            assert.notEqual(folder, null);
            folder.getDataValue('name').should.equal('ROOT');
            done();
        })
        .catch(function(err) {
            done(err);
        });
    });

    it('should get a list of folders for one user', function(done) {
        return Folder.find({
            where: {
                UserUsername: testUser,
                name: 'ROOT',
                hierarchyLevel: 1
            },
            include: [FolderItem]
        })
        .then(function(folder) {
            assert.notEqual(folder, null);
            console.log(JSON.stringify(folder));
            done();
        })
        .catch(function(err) {
            done(err);
        });
    });

});
