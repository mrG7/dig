'use strict';

// TODO: clean this controller.  loading was being used
// by two $watch handlers.

angular.module('digApp')
.controller('SearchCtrl', ['$scope', '$state', '$http', '$modal', 'imageSearchService', 'euiSearchIndex', 'euiConfigs',
    function($scope, $state, $http, $modal, imageSearchService, euiSearchIndex, euiConfigs) {
    $scope.loading = false;
    $scope.imagesimLoading = false;
    $scope.searchConfig = {};
    $scope.searchConfig.filterByImage = false;
    $scope.searchConfig.euiSearchIndex = '';
    $scope.imageFilters = {};
    $scope.euiConfigs = euiConfigs;
    $scope.facets = euiConfigs.facets;
    $scope.notificationHasRun = true;
    $scope.displayImageBreadcrumb = false;


    $scope.saveQuery = function() {
        $modal.open({
            templateUrl: 'app/queries/save-query.html',
            controller: 'SaveQueryCtrl',
            resolve: {
                digState: function() {
                    return {
                        searchTerms: $scope.queryString.submitted,
                        filters: $scope.filterStates,
                        includeMissing: $scope.includeMissing,
                        selectedSort: $scope.selectedSort
                    };
                }, elasticUIState: function() {
                    return {
                        queryState: $scope.indexVM.query ? $scope.indexVM.query.toJSON() : {},
                        filterState: $scope.indexVM.filters.getAsFilter() ? $scope.indexVM.filters.getAsFilter().toJSON() : {}
                    };
                }
            },
            size: 'sm'
        });
    };

    $scope.init = function() {
        $scope.showresults = false;
        $scope.queryString = {
            live: '', submitted: ''
        };
        $scope.filterStates = {
            aggFilters: {},
            textFilters: {},
            dateFilters: {}
        };
        $scope.includeMissing = {
            aggregations: {},
            allIncludeMissing: false
        };

        $scope.selectedSort = {};

        if($state.params && $state.params.query && $state.params.query.digState) {

            if($state.params.query.digState.searchTerms) {
                $scope.queryString.live = $state.params.query.digState.searchTerms;
            }

            if($state.params.query.digState.filters) {
                if($state.params.query.digState.filters.aggFilters) {
                    $scope.filterStates.aggFilters = _.cloneDeep($state.params.query.digState.filters.aggFilters);
                }

                if($state.params.query.digState.filters.textFilters) {
                    $scope.filterStates.textFilters = _.cloneDeep($state.params.query.digState.filters.textFilters);
                }

                if($state.params.query.digState.filters.dateFilters) {
                    $scope.filterStates.dateFilters = _.cloneDeep($state.params.query.digState.filters.dateFilters);
                }

                if($state.params.query.digState.filters.withImagesOnly) {
                    $scope.filterStates.withImagesOnly = $state.params.query.digState.filters.withImagesOnly;
                }
            }
            
            if($state.params.query.digState.includeMissing) {
                if($state.params.query.digState.includeMissing.allIncludeMissing) {
                    $scope.includeMissing.allIncludeMissing = $state.params.query.digState.includeMissing.allIncludeMissing;
                }
                
                if($state.params.query.digState.includeMissing.aggregations) {
                    $scope.includeMissing.aggregations = _.cloneDeep($state.params.query.digState.includeMissing.aggregations);
                }
            }

            if($state.params.query.notificationHasRun === false) {
                $scope.notificationHasRun = $state.params.query.notificationHasRun;
                $scope.notificationLastRun = new Date($state.params.query.lastRunDate);  
                $http.put('api/queries/' + $state.params.query.id, {lastRunDate: new Date(), notificationHasRun: true});
            } else if($state.params.query.digState.selectedSort) {
                $scope.selectedSort = _.cloneDeep($state.params.query.digState.selectedSort);
            }

            $scope.$on('$locationChangeSuccess', function() {
                if($state.current.name === 'search.results.list' && $scope.showresults === false) {
                    $scope.submit();
                }
            });

            if($state.params.callSubmit && $state.current.name === 'search.results.list' && $scope.showresults === false) {
                $scope.submit();
            }
        }
    };

    $scope.clearNotification = function() {
        if($state.params.query && $scope.notificationHasRun === false && $scope.notificationLastRun) {
            $scope.notificationLastRun = null;
            $scope.notificationHasRun = true;
        }
    };

    $scope.removeAggFilter = function(key1, key2) {
        $scope.filterStates.aggFilters[key1][key2] = false;
    };

    $scope.removeMissingFilter = function(key) {
        $scope.includeMissing.aggregations[key].active = false;
    };

    $scope.setAllIncludeMissing = function() {
        $scope.includeMissing.allIncludeMissing = !$scope.includeMissing.allIncludeMissing;
        for(var aggregation in $scope.includeMissing.aggregations) {
            $scope.includeMissing.aggregations[aggregation].active = $scope.includeMissing.allIncludeMissing;
        }
    };

    $scope.removeDateFilter = function(key1, key2) {
        $scope.filterStates.dateFilters[key1][key2] = null;
    };
    
    $scope.removeTextFilter = function(textKey) {
        $scope.filterStates.textFilters[textKey].live = '';
        $scope.filterStates.textFilters[textKey].submitted = '';
    };

    $scope.submit = function() {
        if($state.params.query && $scope.queryString.live !== $state.params.query.digState.searchTerms) {
            $scope.clearNotification();
        }
        
        $scope.queryString.submitted = $scope.queryString.live;
        if(!$scope.searchConfig.euiSearchIndex) {
            $scope.searchConfig.euiSearchIndex = euiSearchIndex;
        }
        $scope.viewList();
    };

    $scope.viewList = function() {
        $state.go('search.results.list');
    };

    $scope.TestFunction = function(searchUrl) {
        if (imageSearchService.isImageSearchEnabled(searchUrl)) {
            return searchUrl;
        }
        else {
            return "";
        }
    };

    $scope.toggleImageSearchEnabled = function(searchUrl) {
        imageSearchService.setImageSearchEnabled(searchUrl, !imageSearchService.isImageSearchEnabled(searchUrl));
    };

    $scope.isImageSearchEnabled = function(searchUrl) {
        return imageSearchService.isImageSearchEnabled(searchUrl);
    };

    $scope.getImageSearchFilter = function(searchUrl) {
        return imageSearchService.getImageSearchFilter(searchUrl);
    };

    $scope.clearSearch = function() {
        $scope.queryString.live = '';
        $scope.submit();
    };

    $scope.reload = function() {
        $state.go('search.results.list', {}, {
            reload: true
        });
    };

    $scope.getActiveImageSearch = function() {
        return imageSearchService.getActiveImageSearch();
    };

    $scope.toggleActiveImageSearch = function(imgUrl) {

        console.log(imageSearchService.isImageSearchEnabled(imgUrl));
        console.log(imgUrl);
        console.log(imageSearchService.getActiveImageSearch().url);
        if (imageSearchService.isImageSearchEnabled(imgUrl) == true && imageSearchService.getActiveImageSearch().url != imgUrl) {//if now enabled and not active
        console.log("Went through 1");
        imageSearchService.toggleActiveImageSearch(imgUrl, true);//set to active
        $scope.searchConfig.filterByImage = true;//ensure search is working
        }
        else if (imageSearchService.isImageSearchEnabled(imgUrl) != true && imageSearchService.getActiveImageSearch().url == imgUrl) {//if unenabled and active
        console.log("Went through 2");
        //if there are any other enabled filters, pass in that URl and make THAT the active search.
            if (Object.keys(imageSearchService.getImageSearchResults()).length > 1) {//If there are other filters
                for (var tempUrl in Object.keys(imageSearchService.getImageSearchResults())) {//look for them
                    if (imageSearchService.getImageSearchResults(tempUrl).enabled == true) {//if any are enabled
                        imageSearchService.toggleActiveImageSearch(tempUrl, true);//make the other one the active search.

                    }//end if
                }//end for
            }//end if length ==1 
            else {//if there are no other filters and we are disabling the only one
                console.log("No others, set as false");
                imageSearchService.setImageSearchEnabled(imgUrl, false);//set enable to false
            }//end else
        }//end else if
        else if (imageSearchService.isImageSearchEnabled(imgUrl) != true && imageSearchService.getActiveImageSearch().url != imgUrl) {//if unenabled and inactive
        console.log("went through 3");
            imageSearchService.setImageSearchEnabled(imgUrl, false);//if we are unenabling one that is not the active search.  Simply unenable it.
        }
                else if (imageSearchService.isImageSearchEnabled(imgUrl) == true && imageSearchService.getActiveImageSearch().url == imgUrl) {//if enabled and active 
                    //(will happen when we unenable a single active and then re-enable it; we need one filter active to maintain the sidebar filters, so we leave it as active.
        console.log("went through 4");
            imageSearchService.setImageSearchEnabled(imgUrl, true);//if we are unenabling one that is not the active search.  Simply unenable it.
        }
        else{
        console.log("went through 5");
        //otherwise set activeSearch as null...there are no other searches.
        //$scope.searchConfig.filterByImage = false;
        imageSearchService.clearActiveImageSearch();
        }//end else
    };

    $scope.getImageSearchResults = function() {
        return imageSearchService.getImageSearchResults();
    };

    $scope.getSpecificImageSearchResults = function(url) {
        return imageSearchService.getSpecificImageSearchResults(url);

    };

    $scope.getImageSearchResultsUrls = function() {
        return Object.keys(imageSearchService.getImageSearchResults());
    };

    $scope.clearActiveImageSearch = function() {
        $scope.searchConfig.filterByImage = false;
        imageSearchService.clearActiveImageSearch();
    };

    $scope.clearImageSearch = function(imgUrl) {
        if (imgUrl == imageSearchService.getActiveImageSearch().url && imageSearchService.getImageSearchResults().length > 1) {// If we're deleting the active filter and there are other filters
            console.log("case1");
                for (var tempUrl in imageSearchService.getImageSearchResults()) {//for the remaining filters
                    if (imageSearchService.getSpecificImageSearchResults(tempUrl).url !=imgUrl) {//find one that is not the active
                        activeImageSearch = imageSearchResults[tempUrl];//make that one active
                        delete imageSearchResults[imgUrl];//and delete the old one
                    }//end if
                }//end for
        }//end if
        else if (imgUrl == imageSearchService.getActiveImageSearch().url) {// if we're deleting the active filter and there are no other filters
                                console.log("case2");

                    $scope.searchConfig.filterByImage = false;
                    imageSearchService.clearActiveImageSearch(imgUrl);    
        }
        else {//if we are not deleting the active
                        console.log("case3");

            imageSearchService.clearImageSearch(imgUrl);
        }
    };

    $scope.toggleImageFilter = function(imgUrl) { 
        imageSearchService.toggleImageFilter(imgUrl);

    };

    $scope.imageSearch = function(imgUrl) {
        $scope.displayImageBreadcrumb = true;
        imageSearchService.imageSearch(imgUrl);
        var temp = imageSearchService.checkImageSearch();

    };

    $scope.getDisplayImageSrc = function(doc) {
        var src = '';
        var currentSearch = imageSearchService.getActiveImageSearch();

        // Default behavior.  Grab the only cached versions of the images from our docs.
        if(doc._source.hasImagePart && doc._source.hasImagePart.cacheUrl) {
            src = doc._source.hasImagePart.cacheUrl;
        } else if(doc._source.hasImagePart[0] && doc._source.hasImagePart[0].cacheUrl) {
            src = doc._source.hasImagePart[0].cacheUrl;
        }

        /* jshint camelcase:false */
        // If we have an active image search, check for a matching image.
        if(currentSearch &&
            imageSearchService.isImageSearchEnabled(currentSearch.url) &&
            doc._source.hasFeatureCollection.similar_images_feature) {
            var imgFeature = _.find(doc._source.hasFeatureCollection.similar_images_feature,
                function(item) {
                    return item.featureValue === currentSearch.url;
                });

            // Verify that the current search url is in the similar images feature.  If so, select the matching
            // image.
            if(imgFeature) {
                var imgObj = _.find(doc._source.hasFeatureCollection.similar_images_feature,
                    function(item) {
                        return (typeof item.featureObject !== 'undefined');
                    });
                var imgMatch = _.find(doc._source.hasImagePart,
                    function(part) {
                        return (part.uri === imgObj.featureObject.imageObjectUris[0]);
                    });
                src = (imgMatch && imgMatch.cacheUrl) ? imgMatch.cacheUrl : src;
            }
        }
        /* jshint camelcase:true */

        return src;
    };

    $scope.toggleListItemOpened = function(index) {
        $scope.opened[index] = !($scope.opened[index]);
    };

    $scope.isListItemOpened = function(index) {
        return ($scope.opened[index]) ? true : false;
    };

    $scope.$watch(function() {
            return imageSearchService.getActiveImageSearch();
        }, function(newVal) {
            if(newVal) {
                if(newVal.status === 'searching') { 
                    $scope.imagesimLoading = true;
                } else if(newVal.status === 'success' && newVal.enabled) {
                    // If our latest img search was successful, re-issue our query and
                    // enable our image filter.
                    $scope.imagesimLoading = false;
                    $scope.searchConfig.filterByImage = true;
                } else {
                    $scope.imagesimLoading = false;
                    $scope.searchConfig.filterByImage = false;
                }
            } else {
                $scope.displayImageBreadcrumb = false;
                $scope.imagesimLoading = false;
                $scope.searchConfig.filterByImage = false;
            }
        },
        true);


    $scope.$watch('indexVM.loading',
        function(newValue, oldValue) {
            if(newValue !== oldValue) {
                $scope.loading = newValue;

                if($scope.loading === false && $scope.showresults === false && !$scope.indexVM.error) {
                    $scope.showresults = true;
                }

                if($scope.showresults && $scope.indexVM.sort && $scope.indexVM.sort.field() !== '_timestamp') {
                    $scope.clearNotification();
                }

                // First ensure filters are initialized, then check to see if user made updates
                if($scope.showresults && $scope.loading === false && $state.params.query && $state.params.query.elasticUIState.filterState) {
                    var currentFilters = $scope.indexVM.filters.getAsFilter() ? $scope.indexVM.filters.getAsFilter().toJSON() : {};
                    var originalFilters = $state.params.query.elasticUIState.filterState;

                    if(angular.equals(currentFilters, originalFilters)) {
                        $scope.filtersInitialized = true;
                    } else {
                        if($scope.filtersInitialized) {
                            $scope.filtersInitalized = null;
                            $scope.clearNotification();
                        }
                    }
                }
            }
        }
    );

    $scope.$watch('indexVM.error', function() {
        if($scope.indexVM.error) {
            $scope.loading = false;
            $scope.showresults = false;

            $state.go('search.error');
        }
    }, true);

    if($state.current.name === 'search') {
        $scope.viewList();
    }

    $scope.init();

}]);