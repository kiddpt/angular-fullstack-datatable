(function() {
    'use strict';

    angular.module('ptDatatable', [])
        .factory('angularFullstackDatatableService', function($http) {

            var angularFullstackDatatabeService = {
                wrap: function(s) {
                    if (!s.url) {
                        throw new Error('URL is required for a service');
                    }

                    // Get common methods from factory
                    var service = {};
                    var resourcePath = s.url;

                    var List = function() {
                        return {
                            data: [],
                            currentPage: 0,
                            totalRows: 0,
                            totalPages: 0,
                            error: false,
                            loading: false,
                            params: {
                                limit: s.defaultLimit || 10,
                                offset: s.defaultOffset || 0,
                                keyword: '',
                                order: s.defaultOrder || '-dateCreated'
                            },
                            getPages: function() {
                                if (this.totalRows) {
                                    this.range = ((parseInt(this.currentPage) - 1) * parseInt(this.params.limit) + 1) + '-' + ((parseInt(this.currentPage) - 1) * parseInt(this.params.limit) + this.data.length);
                                } else {
                                    this.range = 0;
                                }

                                this.pages = [];
                                var setBack = 2 + Math.max(0, 2 - (this.totalPages - this.currentPage));
                                var offset = 2 + Math.max(0, 3 - this.currentPage);
                                for (var i = Math.max(1, this.currentPage - setBack); i <= Math.min(this.currentPage + offset, this.totalPages); i++) {
                                    this.pages.push({
                                        active: i === this.currentPage,
                                        page: i
                                    });
                                }
                            },
                            setPage: function(i) {
                                if (this.loading) {
                                    return;
                                }
                                this.params.offset = this.params.limit * (i - 1);
                                this.update();
                            },
                            hasNext: function() {
                                if (this.totalRows && (this.params.offset + this.data.length < this.totalRows)) {
                                    return true;
                                }
                                return false;
                            },
                            hasPrevious: function() {
                                if (this.totalRows && this.data.length && this.params.offset > 0) {
                                    return true;
                                }
                                return false;
                            },
                            nextPage: function() {
                                if (this.loading) {
                                    return;
                                }

                                if (this.hasNext()) {
                                    this.params.offset += this.params.limit;
                                    this.update();
                                }
                            },
                            previousPage: function() {
                                if (this.loading) {
                                    return;
                                }
                                if (this.hasPrevious()) {
                                    this.params.offset -= this.params.limit;
                                    this.update();
                                }
                            },
                            firstPage: function() {
                                if (this.loading) {
                                    return;
                                }
                                if (this.hasPrevious()) {
                                    this.params.offset = 0;
                                    this.update();
                                }
                            },
                            lastPage: function() {
                                if (this.loading) {
                                    return;
                                }
                                if (this.hasNext()) {
                                    this.params.offset = Math.floor(this.totalPages / this.params.limit);
                                    this.update();
                                }
                            },
                            update: function(resetOffset) {
                                var list = this;

                                if (this.loading) {
                                    return;
                                }

                                if (resetOffset) {
                                    this.params.offset = 0;
                                }

                                // list.data = [];
                                list.loading = true;
                                //socket.unsyncUpdates(resourcePath.split('/').pop().replace(/s$/, ''), list, list.fixStats);

                                $http({
                                    method: 'GET',
                                    url: resourcePath,
                                    params: list.params
                                }).then(function(response) {
                                    list.loading = false;
                                    if (response) {
                                        list.data = response.data;
                                        list.totalRows = parseInt(response.headers('Total-rows'));

                                        if (list.params.offset === 0 && !list.params.keyword) {
                                            //socket.syncUpdates(resourcePath.split('/').pop().replace(/s$/, ''), list, list.fixStats);
                                        }

                                        list.updateStats();
                                    }
                                }).catch(function() {
                                    list.loading = false;
                                    list.error = true;
                                });
                            },
                            updateStats: function() {
                                this.currentPage = (this.params.offset / this.params.limit) + 1;
                                this.totalPages = Math.floor((this.totalRows - 1) / this.params.limit) + 1;
                                this.getPages();
                            },
                            fixStats: function(event, item, array, list) {
                                console.log('fixStats');
                                var delta = 0;
                                if (event === 'created') {
                                    delta = 1;
                                } else if (event === 'deleted') {
                                    delta = -1;
                                }
                                list.totalRows = (list.totalRows || 0) + delta;

                                if (list.params && list.params.order) {
                                    console.log(list.params);
                                    var col, dir;
                                    var tokens = list.params.order.split(/ /);
                                    col = tokens[0];

                                    if (tokens.length > 1) {
                                        dir = tokens[1] === 'asc' ? true : false;
                                    } else {
                                        if (col.charAt(0) === '-') {
                                            col = col.substring(1);
                                            dir = false;
                                        } else if (col.charAt(0) === '+') {
                                            col = col.substring(1);
                                            dir = true;
                                        } else {
                                            dir = false;
                                        }
                                    }

                                    console.log('before', list.data, [col], [dir]);
                                    list.data = _.sortByOrder(list.data, [col], [dir]);
                                    console.log('after', list.data);
                                }

                                list.data = list.data.slice(0, list.params.limit);

                                list.updateStats();
                            }
                        };
                    };

                    service.list = function(limit) {
                        if (resourcePath) {
                            var list = new List();
                            list.data = [];
                            list.params.limit = parseInt(limit) || list.params.limit;
                            list.update();

                            return list;
                        } else {
                            return null;
                        }
                    };

                    return service;
                }
            };

            return angularFullstackDatatabeService;

        });
})();
