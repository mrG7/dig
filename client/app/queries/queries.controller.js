'use strict';

angular.module('digApp')
.controller('QueriesCtrl', ['$scope', '$state', '$http', 'User', 'euiConfigs',
    function($scope, $state, $http, User, euiConfigs) {

    $scope.currentUser = User.get();
    $scope.opened = [];
    $scope.frequencyOptions = ['daily', 'weekly', 'monthly'];
    $scope.facets = euiConfigs.facets;


    $scope.getQueries = function() {
        $http.get('api/query/').
            success(function(data) {
                $scope.queryResults = data;
            });
    };

    $scope.toggleListItemOpened = function(index) {
        $scope.opened[index] = !($scope.opened[index]);
    };

    $scope.isListItemOpened = function(index) {
        return ($scope.opened[index]) ? true : false;
    };

    $scope.deleteQuery = function(id) {
        $http.delete('api/query/' + id).
            success(function() {
                $scope.getQueries();
            });
    };

    $scope.toggleFrequency = function(id, selectedOption) {
        $http.put('api/query/' + id, {frequency: selectedOption});
    };

    $scope.runQuery = function(query) {
        $state.go('search.results.list', {
            query: query
        }, {
            location: true
        });
    };

    $scope.getQueries();

}]);
