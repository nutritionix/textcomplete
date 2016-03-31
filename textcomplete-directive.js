(function () {
  'use strict';

  angular.module('nix.textcomplete', ['ngTextcomplete'])
    .directive('textcomplete', ['Textcomplete', '$q', '$filter', function (Textcomplete, $q, $filter) {
      return {
        restrict: 'EA',
        scope:    {
          members: '=',
          message: '='
        },
        replace:  true,
        template: '<textarea ng-model="message" type="text"></textarea>',
        link:     function (scope, element/*, attributes*/) {
          $q.when(scope.members)
            .then(function (mentions) {
              var textcomplete = new Textcomplete(element, [
                {
                  match:   /(^|\s)([\w\-]*)$/,
                  search:  function (term, callback) {
                    var results = [];

                    if ((term && term.toString() || '').length >= 3) {
                      results = $filter('orderBy')($.map(mentions, function (mention) {
                        return mention.toLowerCase().indexOf(term.toLowerCase()) > -1 ? mention : null;
                      }), 'length');
                    }

                    callback(results);
                  },
                  index:   2,
                  replace: function (mention) {
                    return '$1' + mention + ' ';
                  }
                }
              ]);

              $(textcomplete).on({
                'textComplete:select': function (e, value) {
                  scope.$apply(function () {
                    scope.message = value
                  })
                },
                'textComplete:show':   function (e) {
                  $(this).data('autocompleting', true);
                },
                'textComplete:hide':   function (e) {
                  $(this).data('autocompleting', false);
                }
              });
            });
        }
      }
    }]);
}());


