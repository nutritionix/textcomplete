'use strict';

(function () {
  'use strict';

  angular.module('nix.textcomplete', ['ngTextcomplete']).factory('TextCompleteStrategy', ["$q", "$filter", "$log", function ($q, $filter, $log) {
    function TextCompleteStrategy() {
      this.sources = [];
      this.minChars = 1;
    }

    TextCompleteStrategy.prototype.match = /(^|\s)([\w\-]*)$/;
    TextCompleteStrategy.prototype.search = function (term, callback) {
      var results = [],
          resultTexts = [];

      if ((term && term.toString() || '').length >= this.minChars) {
        this.sources.forEach(function (source) {
          if (source.data.length) {
            var suggestions = [];
            for (var i = 0; i < source.data.length; i += 1) {
              if (resultTexts.indexOf(source.data[i]) === -1 && source.data[i].toLowerCase().indexOf(term.toLowerCase()) > -1) {
                suggestions.push(source.data[i]);
              }

              if (source.limit > 0 && suggestions.length >= source.limit) {
                break;
              }
            }

            resultTexts = resultTexts.concat(suggestions);
            results = results.concat(suggestions.map(function (text) {
              return { text: text, source: source };
            }));
          }
        });
      }

      this.minChars = 2;
      callback(results);
    };
    TextCompleteStrategy.prototype.index = 2;
    TextCompleteStrategy.prototype.replace = function (value) {
      return '$1' + value.text + ' ';
    };

    TextCompleteStrategy.prototype.addSource = function (source, priority, limit, sorted, template) {
      var sourceDefinition = {
        data: [],
        priority: priority || 0,
        limit: limit || -1,
        template: angular.isFunction(template) ? template : function (value) {
          return value;
        }
      };

      $q.when(source).then(function (data) {
        if (angular.isArray(data)) {
          sourceDefinition.data = sorted ? data : $filter('orderBy')(data, 'length');
        } else {
          $log.error('Source did not resolve to array:', source, data);
        }
      });

      this.sources.push(sourceDefinition);

      this.sources.sort(function (first, second) {
        return second.priority - first.priority;
      });
    };

    TextCompleteStrategy.prototype.template = function (value) {
      return value.source.template(value.text);
    };

    return TextCompleteStrategy;
  }]).directive('textcomplete', ["Textcomplete", function (Textcomplete) {
    return {
      restrict: 'EA',
      scope: {
        strategy: '='
      },
      replace: true,
      require: 'ngModel',
      template: '<textarea></textarea>',
      link: function link(scope, element, attributes, ngModelController) {
        var textcomplete = new Textcomplete(element, angular.isArray(scope.strategy) ? scope.strategy : [scope.strategy]);

        angular.element(textcomplete).on({
          'textComplete:select': function textCompleteSelect(e, value) {
            scope.$apply(function () {
              ngModelController.$setViewValue(value);
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