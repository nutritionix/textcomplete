'use strict';

(function () {
  'use strict';

  angular.module('nix.textcomplete', ['ngTextcomplete']).factory('TextCompleteStrategy', ["$q", "$filter", "$log", function ($q, $filter, $log) {
    function TextCompleteStrategy() {
      this.sources = [];
    }

    TextCompleteStrategy.prototype.match = /(^|\s)([\w\-]*)$/;
    TextCompleteStrategy.prototype.search = function (term, callback) {
      var results = [];

      if ((term && term.toString() || '').length >= 3) {
        this.sources.forEach(function (source) {
          if (source.data.length) {
            var suggestions = [];
            for (var i = 0; i < source.data.length; i += 1) {
              if (results.indexOf(source.data[i]) === -1 && source.data[i].toLowerCase().indexOf(term.toLowerCase()) > -1) {
                suggestions.push(source.data[i]);
              }

              if (source.limit > 0 && suggestions.length >= source.limit) {
                break;
              }
            }

            results = results.concat(suggestions);
          }
        });
      }

      callback(results);
    };
    TextCompleteStrategy.prototype.index = 2;
    TextCompleteStrategy.prototype.replace = function (mention) {
      return '$1' + mention + ' ';
    };

    TextCompleteStrategy.prototype.addSource = function (source, priority, limit) {
      var sourceDefinition = {
        data: [],
        priority: priority || 0,
        limit: limit || -1
      };

      $q.when(source).then(function (data) {
        if (angular.isArray(data)) {
          sourceDefinition.data = $filter('orderBy')(data, 'length');
        } else {
          $log.error('Source did not resolve to array:', source, data);
        }
      });

      this.sources.push(sourceDefinition);

      this.sources.sort(function (first, second) {
        return second.priority - first.priority;
      });
    };

    return TextCompleteStrategy;
  }]).directive('textcomplete', ["Textcomplete", function (Textcomplete) {
    return {
      restrict: 'EA',
      scope: {
        strategy: '=',
        message: '='
      },
      replace: true,
      template: '<textarea ng-model="message" type="text"></textarea>',
      link: function link(scope, element /*, attributes*/) {
        console.log(scope.strategy);

        var textcomplete = new Textcomplete(element, angular.isArray(scope.strategy) ? scope.strategy : [scope.strategy]);

        angular.element(textcomplete).on({
          'textComplete:select': function textCompleteSelect(e, value) {
            scope.$apply(function () {
              scope.message = value;
            });
          },
          'textComplete:show': function textCompleteShow(e) {
            angular.element(this).data('autocompleting', true);
          },
          'textComplete:hide': function textCompleteHide(e) {
            angular.element(this).data('autocompleting', false);
          }
        });
      }
    };
  }]);
})();