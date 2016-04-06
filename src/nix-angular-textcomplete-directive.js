(function () {
  'use strict';

  angular.module('nix.textcomplete', ['ngTextcomplete'])
    .factory('TextCompleteStrategy', function ($q, $filter, $log) {
      function TextCompleteStrategy() {
        this.sources = [];
        this.minChars = 1;

      }

      TextCompleteStrategy.prototype.match = /(^|\s)([\w\-]*)$/;
      TextCompleteStrategy.prototype.search = function (term, callback) {
        let results = [], resultTexts = [];

        if ((term && term.toString() || '').length >= this.minChars) {
          this.sources.forEach(source => {
            if (source.data.length) {
              let suggestions = [];
              for (let i = 0; i < source.data.length; i += 1) {
                if (resultTexts.indexOf(source.data[i]) === -1 &&
                  source.data[i].toLowerCase().indexOf(term.toLowerCase()) > -1) {
                  suggestions.push(source.data[i]);
                }

                if (source.limit > 0 && suggestions.length >= source.limit) {
                  break;
                }
              }

              resultTexts = resultTexts.concat(suggestions);
              results = results.concat(suggestions.map(text => { return {text, source}; }));
            }
          });
        }

        this.minChars = 2;
        callback(results);
      };
      TextCompleteStrategy.prototype.index = 2;
      TextCompleteStrategy.prototype.replace = function (mention) {
        return '$1' + mention + ' ';
      };

      TextCompleteStrategy.prototype.addSource = function (source, priority, limit, sorted, template) {
        let sourceDefinition = {
          data:     [],
          priority: priority || 0,
          limit:    limit || -1,
          template: angular.isFunction(template) || (value => value)
        };

        $q.when(source).then(data => {
          if (angular.isArray(data)) {
            sourceDefinition.data = sorted ? data : $filter('orderBy')(data, 'length');
          } else {
            $log.error('Source did not resolve to array:', source, data);
          }
        });
        
        this.sources.push(sourceDefinition);

        this.sources.sort((first, second) => {
          return second.priority - first.priority;
        });
      };

      TextCompleteStrategy.prototype.template = function (value) {
        return value.source.template(value.text);
      };

      return TextCompleteStrategy;
    })
    .directive('textcomplete', function (Textcomplete) {
      return {
        restrict: 'EA',
        scope:    {
          strategy: '='
        },
        replace:  true,
        require:  'ngModel',
        template: '<textarea></textarea>',
        link:     function (scope, element, attributes, ngModelController) {
          var textcomplete = new Textcomplete(
            element,
            angular.isArray(scope.strategy) ? scope.strategy : [scope.strategy]
          );

          angular.element(textcomplete).on({
            'textComplete:select': function (e, value) {
              scope.$apply(function () {
                ngModelController.$setViewValue(value);
              })
            },
            'textComplete:show':   function (e) {
              angular.element(this).data('autocompleting', true);
            },
            'textComplete:hide':   function (e) {
              angular.element(this).data('autocompleting', false);
            }
          });
        }
      }
    });
}());


