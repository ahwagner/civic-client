(function() {
  'use strict';
  angular.module('civic.account')
    .controller('AccountNotificationsController', AccountNotificationsController);

  // @ngInject
  function AccountNotificationsController($scope,
                                          $location,
                                          $state,
                                          $stateParams,
                                          CurrentUser,
                                          Security,
                                          _) {
    var vm = $scope.vm = {};

    // set up collections that generate menu and notifications list
    vm.categories = [];
    vm.notifications = [];

    // assign page params to vm from $stateParams, or defaults
    _.defaults(vm,
      {
        category: $stateParams.category,
        page: Number($stateParams.page),
        count: Number($stateParams.count)
      },
      {
        category: 'all',
        page: 1,
        count: 10
      });

    // assign filter params
    vm.filters = {};
    _.defaults(vm.filters,
      {
        // convert show_read, _unlinkable to bools if necessary
        show_read: _.isString($stateParams.show_read) ? $stateParams.show_read === 'true' : $stateParams.show_read,
        show_unlinkable: _.isString($stateParams.show_unlinkable) ? $stateParams.show_unlinkable === 'true' : $stateParams.show_unlinkable,
        limit: $stateParams['filter[limit]'],
        name: $stateParams['filter[name]']
      },
      {
        show_read: false,
        show_unlinkable: false,
        limit: 'all_time',
        name: ''
      });

    vm.countOptions= [10,25,50,100]; // per-page dropdown options

    // set up filter fields
    vm.filterFields = [
      {
        key: 'name',
        type: 'input',
        templateOptions: {
          label: 'Find User',
          required: false
        },
        watcher: {
          listener: function(field, newValue, oldValue, scope, stopWatching) {
            if(newValue !== oldValue) {
              vm.fetch();
            }
          }
        }
      },
      {
        key: 'limit',
        type: 'select',
        templateOptions: {
          label: 'Limit To',
          required: false,
          options: [
            // this_week, this_month, this_year, all_time
            {name: 'All time', value: 'all_time'},
            {name: 'This week', value: 'this_week'},
            {name: 'This month', value: 'this_month'},
            {name: 'This year', value: 'this_year'}
          ]
        },
        watcher: {
          listener: function(field, newValue, oldValue, scope, stopWatching) {
            if(newValue !== oldValue) {
              vm.fetch();
            }
          }
        }
      },
      {
        key: 'show_unlinkable',
        type: 'checkbox',
        templateOptions: {
          label: 'Show Unlinkable',
          required: false
        },
        watcher: {
          listener: function(field, newValue, oldValue, scope, stopWatching) {
            if(newValue !== oldValue) {
              vm.fetch();
            }
          }
        }
      },
      {
        key: 'show_read',
        type: 'checkbox',
        templateOptions: {
          label: 'Show Read',
          required: false
        },
        watcher: {
          listener: function(field, newValue, oldValue, scope, stopWatching) {
            if(newValue !== oldValue) {
              vm.fetch();
            }
          }
        }
      }
    ];

    // create categories array to populate sidebar menu
    function generateCategories() {
      // Security.currentUser currently stores the best representation of available categories
      // TODO: probably should make this info available via a more appropriate endpoint
      vm.unread = Security.currentUser.unread_notifications;

      vm.categories = [{
        name: 'all',
        unread: _.reduce(vm.unread, function(res, val, key) {
          return res + val;
        })
      }];

      _.forEach(vm.unread, function(val, key) {
        vm.categories.push({
          name: key,
          unread: val
        });
      });
    }

    // fetch the user's feed using vm.category, vm.page etc.
    vm.fetch =  function() {
      var params = {
        page: Number(vm.page),
        count: Number(vm.count),
        category: vm.category,
        show_read: vm.filters.show_read,
        show_unlinkable: vm.filters.show_unlinkable
      };

      if(!_.isEmpty(vm.filters.name)) {
        params['filter[name]'] = vm.filters.name;
      }
      if(!_.isEmpty(vm.filters.limit)) {
        params['filter[limit]'] = vm.filters.limit;
      }

      var allParams =

      CurrentUser.getFeed(params).then(function(response) {
        var meta = response._meta;
        vm.totalItems = Number(meta.total_count);
        vm.totalPages = Number(meta.total_pages);

        vm.unread = Number(meta.unread);
        vm.totalUnread = _.reduce(vm.unread, function(result, value, key) {
          return result + value;
        });

        generateCategories();
        // TODO: figure out how to specify filter[] query params in $stateProvider so we can keep track of those in the URL as well - until then, omit these from the query params update
        $location.search(_.omit(params, ['filter[limit]', 'filter[name]']));

        angular.copy(response.records, vm.notifications);
      });
    };

    vm.fetch();

    // called from sidebar menu item onClick
    vm.changeCategory = function(category) {
      vm.category = category;
      vm.page = 1;
      vm.fetch();
    };

    // called from pagination control
    vm.pageChanged = function() {
      vm.fetch();
    };

    vm.markAllAsRead = function() {
      CurrentUser.markAllAsRead($stateParams).then(function () {
        console.log('records marked as seen');
        vm.fetch();
      });
    };

    // if(_.isUndefined(vm)) {
    //   var vm = $scope.vm = {};
    // }
    //
    // vm.filters = {
    //   name: String(),
    //   limit: 'all_time'
    // };
    //
    // if(_.isUndefined(vm.page)) {
    //   vm.page = 1;
    // }
    // if(_.isUndefined(vm.category)) {
    //   vm.category = 'all';
    // }
    // if(_.isUndefined(vm.count)) {
    //   vm.count = 10;
    // }
    // if(_.isUndefined(vm.filters.showRead)) {
    //   vm.filters.showRead = false;
    // }
    // if(_.isUndefined(vm.filters.showUnlinkable)) {
    //   vm.filters.showUnlinkable  = false;
    // }
    // // vm.page = $stateParams.page;
    // // vm.category = $stateParams.category;
    // // vm.count = Number($stateParams.count);
    // // vm.filters.showRead = $stateParams.show_read;
    // // vm.filters.showUnlinkable = $stateParams.show_unlinkable;
    //
    // vm.countOptions= [10,25,50,100];
    // vm.notifications = [];
    //
    // vm.unRead = Security.currentUser.unread_notifications;
    //
    // vm.pageChanged = function() {
    //   vm.fetch();
    // };
    //
    // var fetch = function() {
    //   var loc = {
    //     page: vm.page,
    //     count: vm.count,
    //     category: vm.category,
    //     show_read: vm.filters.showRead,
    //     show_unlinkable: vm.filters.showUnlinkable
    //   };
    //
    //   if(!_.isEmpty(vm.filters.name)) {
    //     loc['filter[name]'] = vm.filters.name;
    //   }
    //   if(!_.isEmpty(vm.filters.limit)) {
    //     loc['filter[limit]'] = vm.filters.limit;
    //   }
    //
    //   $state.transitionTo('account.notifications', loc, {notify: false});
    //
    //   CurrentUser.getFeed(loc)
    // };
    //
    // vm.changeCategory = function(category) {
    //   vm.category = category;
    //   vm.page = 1;
    //   vm.fetch();
    // };
    //
    // vm.filterFields = [
    //   {
    //     key: 'name',
    //     type: 'input',
    //     templateOptions: {
    //       label: 'Find User',
    //       required: false
    //     },
    //     watcher: {
    //       listener: function(field, newValue, oldValue, scope, stopWatching) {
    //         if(newValue !== oldValue) {
    //           vm.fetch();
    //         }
    //       }
    //     }
    //   },
    //   {
    //     key: 'limit',
    //     type: 'select',
    //     defaultValue: 'all_time',
    //     templateOptions: {
    //       label: 'Limit To',
    //       required: false,
    //       options: [
    //         // this_week, this_month, this_year, all_time
    //         {name: 'All time', value: 'all_time'},
    //         {name: 'This week', value: 'this_week'},
    //         {name: 'This month', value: 'this_month'},
    //         {name: 'This year', value: 'this_year'}
    //       ]
    //     },
    //     watcher: {
    //       listener: function(field, newValue, oldValue, scope, stopWatching) {
    //         if(newValue !== oldValue) {
    //           vm.fetch();
    //         }
    //       }
    //     }
    //   },
    //   {
    //     key: 'showUnlinkable',
    //     type: 'checkbox',
    //     templateOptions: {
    //       label: 'Show Unlinkable',
    //       required: false
    //     },
    //     watcher: {
    //       listener: function(field, newValue, oldValue, scope, stopWatching) {
    //         if(newValue !== oldValue) {
    //           vm.fetch();
    //         }
    //       }
    //     }
    //   },
    //   {
    //     key: 'showRead',
    //     type: 'checkbox',
    //     defaultValue: false,
    //     templateOptions: {
    //       label: 'Show Read',
    //       required: false
    //     },
    //     watcher: {
    //       listener: function(field, newValue, oldValue, scope, stopWatching) {
    //         if(newValue !== oldValue) {
    //           vm.fetch();
    //         }
    //       }
    //     }
    //   }
    // ];
    //
    // vm.fetch();
    //
    // $scope.$watch(
    //   function() { return CurrentUser.data.feed.records},
    //   function(records){
    //     var meta = CurrentUser.data.feed._meta;
    //     vm.totalItems = Number(meta.total_count);
    //     vm.totalPages = Number(meta.total_pages);
    //
    //     vm.unread = meta.unread;
    //     vm.totalUnread = _.reduce(vm.unread, function(result, value, key) {
    //       return result + value;
    //     });
    //
    //     angular.copy(records, vm.notifications);
    //
    //     //vm.notifications = CurrentUser.data.feed.records;
    //
    //     var getNgHref = function(category) {
    //       return '/#/account/notifications?' +
    //         'category=' + category + '&' +
    //         'page=' + vm.page + '&' +
    //         'count=' + vm.count + '&' +
    //         'show_unlinkable=' + vm.filters.showUnlinkable + '&' +
    //         'show_read=' + vm.filters.showRead;
    //     };
    //
    //     vm.categories = [{
    //       name: 'all',
    //       unread: _.reduce(vm.unread, function(res, val, key) {
    //         return res + val;
    //       })
    //     }];
    //
    //     _.forEach(vm.unread, function(val, key) {
    //       vm.categories.push({
    //         name: key,
    //         unread: val
    //       });
    //     });
    //   }, true);
    //
    // vm.markAllAsRead = function() {
    //   var req = $stateParams;
    //   CurrentUser.markAllAsRead(req).then(function() {
    //     console.log('records marked as seen');
    //   });
    // }
  }
})();
