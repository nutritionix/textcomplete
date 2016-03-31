(function () {
  'use strict';

  angular.module('app', ['nix.textcomplete'])
    .config(['$locationProvider', function ($locationProvider) {
      $locationProvider.html5Mode(true);
    }])
    .controller('textcompleteCtrl', ['$scope', '$http', '$location', function ($scope, $http, $location) {
      var vm = this;

      console.log($location.search());

      var remoteFile = $location.search().json || 'https://nix-export.s3.amazonaws.com/demo-phrases.json.gz';

      vm.membersRemote = $http.get(remoteFile)
        .then(function (response) {
          vm.previewMembers.remote = response.data;
          return response.data || [];
        });

      vm.membersLocal = ['carrots', 'celery', 'crayfish', 'chocolate', 'chorizo', 'cobbler', 'cheese'];

      vm.previewMembers = {
        remote: [],
        local:  vm.membersLocal
      }
    }]);
}());


